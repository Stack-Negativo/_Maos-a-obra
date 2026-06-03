"""create reviews and history tables

Revision ID: 0b818e42a439
Revises: 609724dd16c5
Create Date: 2026-05-22 15:51:02.426569

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0b818e42a439"
down_revision = "609724dd16c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use String for everything to avoid ENUM conflicts in migrations
    op.create_table(
        "reviews",
        sa.Column("service_order_id", sa.UUID(), nullable=False),
        sa.Column("reviewer_id", sa.UUID(), nullable=False),
        sa.Column("reviewed_id", sa.UUID(), nullable=False),
        sa.Column("direction", sa.String(length=50), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["reviewed_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["reviewer_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )
    op.create_index(
        op.f("ix_reviews_reviewed_id"), "reviews", ["reviewed_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_reviewer_id"), "reviews", ["reviewer_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_service_order_id"),
        "reviews",
        ["service_order_id"],
        unique=False,
    )

    op.create_table(
        "service_order_history",
        sa.Column("service_order_id", sa.UUID(), nullable=False),
        sa.Column("old_status", sa.String(length=50), nullable=True),
        sa.Column("new_status", sa.String(length=50), nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["actor_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )
    op.create_index(
        op.f("ix_service_order_history_service_order_id"),
        "service_order_history",
        ["service_order_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_service_order_history_service_order_id"),
        table_name="service_order_history",
    )
    op.drop_table("service_order_history")
    op.drop_index(op.f("ix_reviews_service_order_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_reviewer_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_reviewed_id"), table_name="reviews")
    op.drop_table("reviews")
