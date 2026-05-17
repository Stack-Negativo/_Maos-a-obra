from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    NotFoundException,
    ValidationException,
)
from domain.enums import OrderStatus
from domain.order_state_machine import OrderStateMachine
from models.service_order import ServiceOrder
from repositories.address_repository import AddressRepository
from repositories.service_order_repository import ServiceOrderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.service_order import ServiceOrderCreate


class ServiceOrderService:
    def __init__(
        self,
        order_repository: ServiceOrderRepository,
        address_repository: AddressRepository,
        specialty_repository: SpecialtyRepository,
    ):
        self.order_repository = order_repository
        self.address_repository = address_repository
        self.specialty_repository = specialty_repository

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

        return await self.order_repository.create(order)

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
        order = await self.get_order(order_id)

        if order.client_id != client_id:
            # In a real scenario, an admin could also cancel
            raise BusinessRuleViolation(
                "Apenas o cliente proprietário pode cancelar esta ordem."
            )

        if not reason:
            raise ValidationException("O motivo do cancelamento é obrigatório.")

        # Validate transition via StateMachine
        OrderStateMachine.validate_transition(order.status, OrderStatus.CANCELLED)

        return await self.order_repository.update(
            order, {"status": OrderStatus.CANCELLED, "cancellation_reason": reason}
        )
