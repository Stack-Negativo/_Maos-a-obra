from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
)
from domain.enums import OrderStatus, ReviewDirection
from models.review import Review
from repositories.provider_repository import ProviderRepository
from repositories.review_repository import ReviewRepository
from repositories.service_order_repository import ServiceOrderRepository
from schemas.review import ReviewCreate


class ReviewService:
    def __init__(
        self,
        review_repository: ReviewRepository,
        order_repository: ServiceOrderRepository,
        provider_repository: ProviderRepository,
    ):
        self.review_repository = review_repository
        self.order_repository = order_repository
        self.provider_repository = provider_repository

    async def create_review(
        self, reviewer_id: UUID, order_id: UUID, data: ReviewCreate
    ) -> Review:
        # 1. Validate Service Order
        order = await self.order_repository.get_by_id(order_id)
        if not order:
            raise NotFoundException("Ordem de Serviço não encontrada.")

        # RAV06 — Ordem finalizada obrigatória
        if order.status != OrderStatus.FINISHED:
            raise BusinessRuleViolation(
                "Avaliações somente podem ocorrer após a finalização da OS.",
                error_code="ORDER_NOT_FINISHED",
            )

        # 2. Determine Reviewed and validate direction
        if data.direction == ReviewDirection.CLIENT_TO_PROVIDER:
            if order.client_id != reviewer_id:
                raise BusinessRuleViolation(
                    "Apenas o cliente pode avaliar o prestador.",
                    error_code="PERMISSION_DENIED",
                )
            if not order.provider_id:
                raise BusinessRuleViolation("Esta OS não possui um prestador.")

            # We need the provider's user_id
            provider = await self.provider_repository.get_by_id(order.provider_id)
            if not provider:
                raise NotFoundException("Prestador não encontrado.")
            reviewed_id = provider.user_id

        elif data.direction == ReviewDirection.PROVIDER_TO_CLIENT:
            provider = await self.provider_repository.get_by_user_id(reviewer_id)
            if not provider or order.provider_id != provider.id:
                raise BusinessRuleViolation(
                    "Apenas o prestador selecionado pode avaliar o cliente.",
                    error_code="PERMISSION_DENIED",
                )
            reviewed_id = order.client_id
        else:
            raise BusinessRuleViolation("Direção de avaliação inválida.")

        # RAV05 — Autoavaliação proibida
        if reviewer_id == reviewed_id:
            raise BusinessRuleViolation(
                "Um usuário não pode avaliar a si próprio.",
                error_code="SELF_REVIEW_PROHIBITED",
            )

        # RI06 — Avaliação Única por direção
        existing = await self.review_repository.get_by_order_and_direction(
            order_id, data.direction
        )
        if existing:
            raise ConflictException(
                "Você já realizou esta avaliação para esta OS.",
                error_code="REVIEW_ALREADY_EXISTS",
            )

        # 3. Create Review
        review = Review(
            service_order_id=order_id,
            reviewer_id=reviewer_id,
            reviewed_id=reviewed_id,
            direction=data.direction,
            rating=data.rating,
            comment=data.comment,
        )

        await self.review_repository.create(review)

        # 4. Update Provider Stats if direction is CLIENT_TO_PROVIDER
        if data.direction == ReviewDirection.CLIENT_TO_PROVIDER:
            # We already have 'provider' loaded
            # We need a flush to see the new review in aggregate queries (func.avg)
            await self.review_repository.session.flush()

            new_avg, new_total = await self.review_repository.get_provider_stats(
                reviewed_id
            )

            provider.rating_average = new_avg
            provider.total_reviews = new_total

            # RN04 — Suspensão por Desempenho (last 10)
            if new_total >= 10:
                last_10_avg = await self.review_repository.get_last_n_reviews_average(
                    reviewed_id, 10
                )
                if last_10_avg is not None and last_10_avg < 3.0:
                    provider.is_suspended = True
                    provider.suspended_at = datetime.now(UTC)

        await self.review_repository.session.commit()
        await self.review_repository.session.refresh(review)
        return review

    async def list_order_reviews(self, order_id: UUID) -> list[Review]:
        reviews = await self.review_repository.list_by_order(order_id)
        return list(reviews)
