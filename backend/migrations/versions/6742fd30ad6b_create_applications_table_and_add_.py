"""create_applications_table_and_add_provider_to_orders

Revision ID: 6742fd30ad6b
Revises: e8b5fae30eec
Create Date: 2026-05-16 22:50:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6742fd30ad6b"
down_revision = "e8b5fae30eec"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add provider_id to service_orders
    op.add_column("service_orders", sa.Column("provider_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_service_orders_provider_id",
        "service_orders",
        "providers",
        ["provider_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_service_orders_provider_id"),
        "service_orders",
        ["provider_id"],
        unique=False,
    )

    # 3. Create service_order_applications table
    op.create_table(
        "service_order_applications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("service_order_id", sa.UUID(), nullable=False),
        sa.Column("provider_id", sa.UUID(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING", "ACCEPTED", "REJECTED", "CANCELLED", name="applicationstatus"
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["providers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "service_order_id", "provider_id", name="uq_order_provider"
        ),
    )
    op.create_index(
        op.f("ix_service_order_applications_provider_id"),
        "service_order_applications",
        ["provider_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_order_applications_service_order_id"),
        "service_order_applications",
        ["service_order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_order_applications_status"),
        "service_order_applications",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    # Drop table and indexes
    op.drop_table("service_order_applications")

    # Drop provider_id from service_orders
    op.drop_index(op.f("ix_service_orders_provider_id"), table_name="service_orders")
    op.drop_constraint(
        "fk_service_orders_provider_id", "service_orders", type_="foreignkey"
    )
    op.drop_column("service_orders", "provider_id")

    # Drop enum
    op.execute("DROP TYPE applicationstatus")
