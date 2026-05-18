from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
)
from domain.enums import OrderStatus
from domain.order_state_machine import OrderStateMachine
from domain.value_objects.date_range import DateRange
from models.scheduling import BusySlotSource, BusySlotStatus, ProviderBusySlot
from repositories.provider_repository import ProviderRepository
from repositories.scheduling_repository import SchedulingRepository
from repositories.service_order_repository import ServiceOrderRepository


class SchedulingService:
    """
    Service responsible for managing provider schedules.
    Implements rules RS01-RS07 and ensures transactional integrity.
    """

    def __init__(
        self,
        scheduling_repository: SchedulingRepository,
        order_repository: ServiceOrderRepository,
        provider_repository: ProviderRepository,
    ):
        self.scheduling_repository = scheduling_repository
        self.order_repository = order_repository
        self.provider_repository = provider_repository

    async def schedule_order(
        self, order_id: UUID, user_id: UUID, start_at: datetime, end_at: datetime
    ) -> ProviderBusySlot:
        """
        Officializes a service order schedule.
        Validates ownership, state transitions, and availability.
        """
        # RS05 — UTC and Timezone-aware check (already enforced by DateRange VO)
        DateRange(start_at=start_at, end_at=end_at)

        # RS06 — Agendamento passado proibido
        if start_at < datetime.now(UTC):
            raise BusinessRuleViolation(
                "Não é permitido agendamento no passado.",
                error_code="PAST_SCHEDULE_PROHIBITED",
            )

        order = await self.order_repository.get_by_id(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # RS07 — Ownership operacional
        # Only client owner, selected provider or admin can schedule.
        is_client = order.client_id == user_id
        is_provider = order.provider and order.provider.user_id == user_id
        if not (is_client or is_provider):
            raise BusinessRuleViolation(
                "Apenas o cliente ou o prestador selecionado podem agendar.",
                error_code="PERMISSION_DENIED",
            )

        # RS02 — Agendamento exige Provider selecionado
        if order.status != OrderStatus.PROVIDER_SELECTED or order.provider_id is None:
            raise BusinessRuleViolation(
                "A OS deve estar em PROVIDER_SELECTED para ser agendada.",
                error_code="ORDER_NOT_READY_FOR_SCHEDULING",
            )

        provider_id = order.provider_id

        # RS01 — Não pode haver overlap
        overlaps = await self.scheduling_repository.find_overlaps(
            provider_id, start_at, end_at
        )
        if len(overlaps) > 0:
            raise ConflictException(
                "O prestador já possui um compromisso para este horário.",
                error_code="SCHEDULE_OVERLAP",
            )

        # RS04 — Agendamento deve ser transacional
        async with self.scheduling_repository.session.begin():
            # Update Order Status (PROVIDER_SELECTED -> SCHEDULED)
            OrderStateMachine.validate_transition(order.status, OrderStatus.SCHEDULED)
            order.status = OrderStatus.SCHEDULED
            order.scheduled_at = start_at

            # Create Busy Slot
            busy_slot = ProviderBusySlot(
                provider_id=provider_id,
                service_order_id=order_id,
                start_at=start_at,
                end_at=end_at,
                source=BusySlotSource.SERVICE_ORDER,
                status=BusySlotStatus.CONFIRMED,
                description=f"Agendamento OS: {order.title}",
            )

            return await self.scheduling_repository.create_busy_slot(busy_slot)

    async def get_provider_schedule(self, provider_id: UUID) -> list[ProviderBusySlot]:
        """Returns the full schedule for a provider."""
        slots = await self.scheduling_repository.list_by_provider(provider_id)
        return list(slots)

    async def get_provider_schedule_by_user(
        self, user_id: UUID
    ) -> list[ProviderBusySlot]:
        """Helper to get schedule using user_id."""
        provider = await self.provider_repository.get_by_user_id(user_id)
        if not provider:
            raise NotFoundException("Perfil de prestador não encontrado.")
        return await self.get_provider_schedule(provider.id)
