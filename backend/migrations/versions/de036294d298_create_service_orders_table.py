"""create_service_orders_table

Revision ID: de036294d298
Revises: 52a1d6a8b1c4
Create Date: 2026-05-16 03:41:25.843325

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "de036294d298"
down_revision = "52a1d6a8b1c4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "service_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("address_id", sa.UUID(), nullable=False),
        sa.Column("specialty_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("preferred_date_start", sa.DateTime(), nullable=False),
        sa.Column("preferred_date_end", sa.DateTime(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("estimated_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("final_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "CREATED",
                "AWAITING_CANDIDATES",
                "AWAITING_SELECTION",
                "PROVIDER_SELECTED",
                "SCHEDULED",
                "IN_PROGRESS",
                "FINISHED",
                "CANCELLED",
                "EXPIRED",
                name="orderstatus",
            ),
            nullable=False,
        ),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["address_id"],
            ["addresses.id"],
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["specialty_id"],
            ["specialties.id"],
        ),
    )
    op.create_index(
        op.f("ix_service_orders_address_id"),
        "service_orders",
        ["address_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_orders_client_id"),
        "service_orders",
        ["client_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_orders_specialty_id"),
        "service_orders",
        ["specialty_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_orders_status"), "service_orders", ["status"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_service_orders_status"), table_name="service_orders")
    op.drop_index(op.f("ix_service_orders_specialty_id"), table_name="service_orders")
    op.drop_index(op.f("ix_service_orders_client_id"), table_name="service_orders")
    op.drop_index(op.f("ix_service_orders_address_id"), table_name="service_orders")
    op.drop_table("service_orders")
    # Enum is usually handled by table drop or shared
    op.execute("DROP TYPE orderstatus")
