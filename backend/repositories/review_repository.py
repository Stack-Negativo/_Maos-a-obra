from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.enums import ReviewDirection
from models.review import Review


class ReviewRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, review: Review) -> Review:
        self.session.add(review)
        return review

    async def get_by_order_and_direction(
        self, order_id: UUID, direction: ReviewDirection
    ) -> Review | None:
        result = await self.session.execute(
            select(Review).where(
                Review.service_order_id == order_id, Review.direction == direction
            )
        )
        return result.scalars().first()

    async def list_by_order(self, order_id: UUID) -> Sequence[Review]:
        result = await self.session.execute(
            select(Review).where(Review.service_order_id == order_id)
        )
        return result.scalars().all()

    async def get_provider_stats(self, provider_user_id: UUID) -> tuple[float, int]:
        """
        Returns (average_rating, total_reviews) for a provider (reviewed_id).
        """
        result = await self.session.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.reviewed_id == provider_user_id,
                Review.direction == ReviewDirection.CLIENT_TO_PROVIDER,
            )
        )
        row = result.first()
        if row and row[0] is not None:
            return float(row[0]), int(row[1])
        return 0.0, 0

    async def get_last_n_reviews_average(
        self, provider_user_id: UUID, n: int = 10
    ) -> float | None:
        """
        Calculates the average rating for the last N reviews received by a provider.
        """
        # Subquery to get the last N reviews
        subquery = (
            select(Review.rating)
            .where(
                Review.reviewed_id == provider_user_id,
                Review.direction == ReviewDirection.CLIENT_TO_PROVIDER,
            )
            .order_by(Review.created_at.desc())
            .limit(n)
            .subquery()
        )

        result = await self.session.execute(select(func.avg(subquery.c.rating)))
        avg = result.scalar()
        return float(avg) if avg is not None else None
