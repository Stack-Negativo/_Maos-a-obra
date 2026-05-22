from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
)
from domain.enums import ApplicationStatus, OrderStatus
from domain.order_state_machine import OrderStateMachine
from models.service_order_application import ServiceOrderApplication
from models.service_order_history import ServiceOrderHistory
from repositories.provider_repository import ProviderRepository
from repositories.service_order_application_repository import (
    ServiceOrderApplicationRepository,
)
from repositories.service_order_history_repository import ServiceOrderHistoryRepository
from repositories.service_order_repository import ServiceOrderRepository


class ServiceOrderApplicationService:
    def __init__(
        self,
        application_repository: ServiceOrderApplicationRepository,
        order_repository: ServiceOrderRepository,
        provider_repository: ProviderRepository,
        history_repository: ServiceOrderHistoryRepository,
    ):
        self.application_repository = application_repository
        self.order_repository = order_repository
        self.provider_repository = provider_repository
        self.history_repository = history_repository

    async def apply_for_order(
        self, provider_user_id: UUID, order_id: UUID
    ) -> ServiceOrderApplication:
        # Get provider profile
        provider = await self.provider_repository.get_by_user_id(provider_user_id)
        if not provider:
            raise NotFoundException("Perfil de prestador não encontrado.")

        # Rule: Provider cannot be suspended
        if provider.is_suspended:
            raise BusinessRuleViolation(
                "Prestadores suspensos não podem se candidatar."
            )

        # Get order
        order = await self.order_repository.get_by_id(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # Rule: Client cannot apply for their own order
        if order.client_id == provider_user_id:
            raise BusinessRuleViolation(
                "Você não pode se candidatar à sua própria ordem."
            )

        # Rule: OS terminal state check
        if order.status in OrderStateMachine.TERMINAL_STATES:
            raise BusinessRuleViolation(
                "Esta Ordem de Serviço já foi finalizada ou cancelada."
            )

        # Rule: OS already has provider selected
        if (
            order.status == OrderStatus.PROVIDER_SELECTED
            or order.provider_id is not None
        ):
            raise BusinessRuleViolation(
                "Esta Ordem de Serviço já possui um prestador selecionado."
            )

        # Rule: Compatible specialty
        provider_specialties = [ps.specialty_id for ps in provider.specialties]
        if order.specialty_id not in provider_specialties:
            raise BusinessRuleViolation(
                "Você não possui a especialidade necessária para esta ordem."
            )

        # Rule: No double application
        existing = await self.application_repository.get_by_order_and_provider(
            order_id, provider.id
        )
        if existing:
            raise ConflictException("Você já se candidatou para esta ordem.")

        # Create application
        application = ServiceOrderApplication(
            service_order_id=order_id,
            provider_id=provider.id,
            status=ApplicationStatus.PENDING,
        )

        created = await self.application_repository.create(application)

        # Transition OS from AWAITING_CANDIDATES to AWAITING_SELECTION if needed
        if order.status == OrderStatus.AWAITING_CANDIDATES:
            old_status = order.status
            order.status = OrderStatus.AWAITING_SELECTION

            # Record History
            history = ServiceOrderHistory(
                service_order_id=order_id,
                old_status=old_status,
                new_status=order.status,
                actor_id=provider_user_id,
                reason="First application received",
            )
            await self.history_repository.create(history)

        await self.application_repository.session.commit()
        await self.application_repository.session.refresh(created)
        return created

    async def accept_application(
        self, client_user_id: UUID, application_id: UUID
    ) -> ServiceOrderApplication:
        application = await self.application_repository.get_by_id(application_id)
        if not application:
            raise NotFoundException("Candidatura não encontrada.")

        if application.status != ApplicationStatus.PENDING:
            raise BusinessRuleViolation(
                "Apenas candidaturas pendentes podem ser aceitas."
            )

        order = await self.order_repository.get_by_id(application.service_order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço vinculada não encontrada.")

        # Rule: Only order owner can accept
        if order.client_id != client_user_id:
            raise BusinessRuleViolation(
                "Você não tem permissão para aceitar candidaturas nesta ordem."
            )

        # Validate transition via StateMachine
        OrderStateMachine.validate_transition(
            order.status, OrderStatus.PROVIDER_SELECTED
        )

        # 1. Accept this application
        application.status = ApplicationStatus.ACCEPTED

        # 2. Reject all other pending applications for this order
        await self.application_repository.reject_others(order.id, application.id)

        # 3. Update OS provider and status
        old_status = order.status
        order.provider_id = application.provider_id
        order.status = OrderStatus.PROVIDER_SELECTED

        # Record History
        history = ServiceOrderHistory(
            service_order_id=order.id,
            old_status=old_status,
            new_status=order.status,
            actor_id=client_user_id,
            reason="Provider selected",
        )
        await self.history_repository.create(history)

        await self.application_repository.session.commit()
        await self.application_repository.session.refresh(application)
        return application

    async def list_order_applications(
        self, user_id: UUID, order_id: UUID
    ) -> list[ServiceOrderApplication]:
        order = await self.order_repository.get_by_id(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # Rule: Only owner or admin can see all applications
        if order.client_id != user_id:
            # Check if user is a provider who applied
            provider = await self.provider_repository.get_by_user_id(user_id)
            if not provider:
                raise BusinessRuleViolation("Acesso negado.")

            app = await self.application_repository.get_by_order_and_provider(
                order_id, provider.id
            )
            if not app:
                raise BusinessRuleViolation("Acesso negado.")
            return [app]

        apps = await self.application_repository.list_by_order(order_id)
        return list(apps)
