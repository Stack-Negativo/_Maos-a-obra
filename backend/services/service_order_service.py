from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    NotFoundException,
    ValidationException,
)
from domain.enums import OrderStatus
from domain.order_state_machine import OrderStateMachine
from models.service_order import ServiceOrder
from models.service_order_history import ServiceOrderHistory
from repositories.address_repository import AddressRepository
from repositories.service_order_history_repository import ServiceOrderHistoryRepository
from repositories.service_order_repository import ServiceOrderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.service_order import ServiceOrderCreate
from services.payment_service import PaymentService


class ServiceOrderService:
    def __init__(
        self,
        order_repository: ServiceOrderRepository,
        address_repository: AddressRepository,
        specialty_repository: SpecialtyRepository,
        history_repository: ServiceOrderHistoryRepository,
        payment_service: PaymentService,
    ):
        self.order_repository = order_repository
        self.address_repository = address_repository
        self.specialty_repository = specialty_repository
        self.history_repository = history_repository
        self.payment_service = payment_service

    async def _record_history(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        old_status: OrderStatus | None = None,
        actor_id: UUID | None = None,
        reason: str | None = None,
    ) -> None:
        history = ServiceOrderHistory(
            service_order_id=order_id,
            old_status=old_status,
            new_status=new_status,
            actor_id=actor_id,
            reason=reason,
        )
        await self.history_repository.create(history)

    async def create_order(
        self, client_id: UUID, data: ServiceOrderCreate
    ) -> ServiceOrder:
        # Validate address belongs to client
        address = await self.address_repository.get_by_id(data.address_id)
        if not address or address.user_id != client_id:
            raise ValidationException("Endereço inválido ou não pertence ao cliente.")

        # Validate specialty exists and is active
        specialty = await self.specialty_repository.get_by_id(data.specialty_id)
        if not specialty:
            raise NotFoundException("Especialidade não encontrada.")
        if not specialty.is_active:
            raise BusinessRuleViolation("Especialidade inativa.")

        # Initial status is CREATED
        order = ServiceOrder(
            client_id=client_id,
            address_id=data.address_id,
            specialty_id=data.specialty_id,
            title=data.title,
            description=data.description,
            preferred_date_start=data.preferred_date_start,
            preferred_date_end=data.preferred_date_end,
            status=OrderStatus.CREATED,
        )

        # Automatic transition to AWAITING_CANDIDATES
        next_status = OrderStateMachine.get_next_status(OrderStatus.CREATED)
        if next_status:
            OrderStateMachine.validate_transition(OrderStatus.CREATED, next_status)
            order.status = next_status

        await self.order_repository.create(order)
        # Flush to ensure order.id is populated (default uuid4)
        await self.order_repository.session.flush()

        # Record history
        await self._record_history(
            order_id=order.id,
            new_status=order.status,
            old_status=None,  # First record
            actor_id=client_id,
            reason="Order creation",
        )

        await self.order_repository.session.commit()
        await self.order_repository.session.refresh(order)
        return order

    async def get_order(self, order_id: UUID) -> ServiceOrder:
        order = await self.order_repository.get_by_id(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")
        return order

    async def list_client_orders(self, client_id: UUID) -> list[ServiceOrder]:
        orders = await self.order_repository.list_by_client(client_id)
        return list(orders)

    async def cancel_order(
        self, order_id: UUID, client_id: UUID, reason: str
    ) -> ServiceOrder:
        order = await self.order_repository.get_by_id_for_update(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        if order.client_id != client_id:
            raise BusinessRuleViolation(
                "Apenas o cliente proprietário pode cancelar esta ordem."
            )

        if not reason:
            raise ValidationException("O motivo do cancelamento é obrigatório.")

        # Validate transition via StateMachine
        old_status = order.status
        OrderStateMachine.validate_transition(old_status, OrderStatus.CANCELLED)

        order.status = OrderStatus.CANCELLED
        order.cancellation_reason = reason

        await self._record_history(
            order_id=order.id,
            new_status=order.status,
            old_status=old_status,
            actor_id=client_id,
            reason=reason,
        )

        await self.order_repository.session.commit()
        await self.order_repository.session.refresh(order)
        return order

    async def start_execution(self, order_id: UUID, user_id: UUID) -> ServiceOrder:
        """
        Transition OS from SCHEDULED to IN_PROGRESS.
        Only the selected provider can start execution.
        """
        order = await self.order_repository.get_by_id_for_update(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # Validate actor: only the selected provider can start
        if not order.provider or order.provider.user_id != user_id:
            raise BusinessRuleViolation(
                "Apenas o prestador selecionado pode iniciar a execução.",
                error_code="PERMISSION_DENIED",
            )

        # Validate transition
        old_status = order.status
        OrderStateMachine.validate_transition(old_status, OrderStatus.IN_PROGRESS)

        order.status = OrderStatus.IN_PROGRESS

        await self._record_history(
            order_id=order.id,
            new_status=order.status,
            old_status=old_status,
            actor_id=user_id,
            reason="Execution started",
        )

        await self.order_repository.session.commit()
        await self.order_repository.session.refresh(order)
        return order

    async def complete_execution(self, order_id: UUID, user_id: UUID) -> ServiceOrder:
        """
        Mark execution as completed by the provider.
        Does not change status, but sets provider_finished_at flag.
        """
        order = await self.order_repository.get_by_id_for_update(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # Only the selected provider can mark as completed
        if not order.provider or order.provider.user_id != user_id:
            raise BusinessRuleViolation(
                "Apenas o prestador selecionado pode marcar como concluída.",
                error_code="PERMISSION_DENIED",
            )

        if order.status != OrderStatus.IN_PROGRESS:
            raise BusinessRuleViolation(
                "A ordem deve estar em execução para ser marcada como concluída.",
                error_code="INVALID_ORDER_STATUS",
            )

        order.provider_finished_at = datetime.now(UTC)

        # Record as an event in history even without status change
        await self._record_history(
            order_id=order.id,
            new_status=order.status,
            old_status=order.status,
            actor_id=user_id,
            reason="Provider marked as finished",
        )

        await self.order_repository.session.commit()
        await self.order_repository.session.refresh(order)
        return order

    async def confirm_execution(self, order_id: UUID, user_id: UUID) -> ServiceOrder:
        """
        Confirm finalization by the client.
        Transitions OS to FINISHED and requires provider_finished_at to be set.
        Triggers payment processing.
        """
        order = await self.order_repository.get_by_id_for_update(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # Only the client owner can confirm
        if order.client_id != user_id:
            raise BusinessRuleViolation(
                "Apenas o cliente proprietário pode confirmar a finalização.",
                error_code="PERMISSION_DENIED",
            )

        # Check if provider marked as finished
        if not order.provider_finished_at:
            raise BusinessRuleViolation(
                "A finalização deve ser sinalizada pelo prestador "
                "antes da confirmação.",
                error_code="PROVIDER_NOT_FINISHED",
            )

        # Validate transition via StateMachine with operational_confirmation=True
        old_status = order.status
        OrderStateMachine.validate_transition(
            old_status, OrderStatus.FINISHED, operational_confirmation=True
        )

        order.status = OrderStatus.FINISHED

        # Trigger Payment (Mock)
        if order.estimated_price:
            await self.payment_service.auto_create_and_process_payment(
                client_id=order.client_id,
                service_order_id=order.id,
                amount=order.estimated_price,
                actor_id=user_id,
            )

        await self._record_history(
            order_id=order.id,
            new_status=order.status,
            old_status=old_status,
            actor_id=user_id,
            reason="Client confirmed finalization and payment triggered",
        )

        await self.order_repository.session.commit()
        await self.order_repository.session.refresh(order)
        return order

    async def list_order_history(self, order_id: UUID) -> list[ServiceOrderHistory]:
        """
        Lists all status transitions and operational events for an OS.
        """
        history = await self.history_repository.list_by_order(order_id)
        return list(history)
