"""create_scheduling_tables

Revision ID: 45198cab800a
Revises: 6742fd30ad6b
Create Date: 2026-05-17 23:14:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "45198cab800a"
down_revision = "6742fd30ad6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create provider_busy_slots table
    op.create_table(
        "provider_busy_slots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("provider_id", sa.UUID(), nullable=False),
        sa.Column("service_order_id", sa.UUID(), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "source",
            sa.Enum(
                "SERVICE_ORDER", "MANUAL_BLOCK", "UNAVAILABILITY", name="busyslotsource"
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("CONFIRMED", "TENTATIVE", name="busyslotstatus"),
            nullable=False,
        ),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["providers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # 3. Create Indexes
    op.create_index(
        op.f("ix_provider_busy_slots_provider_id"),
        "provider_busy_slots",
        ["provider_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_busy_slots_service_order_id"),
        "provider_busy_slots",
        ["service_order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_busy_slots_start_at"),
        "provider_busy_slots",
        ["start_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_busy_slots_end_at"),
        "provider_busy_slots",
        ["end_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_busy_slots_source"),
        "provider_busy_slots",
        ["source"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_busy_slots_status"),
        "provider_busy_slots",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    # 1. Drop table
    op.drop_table("provider_busy_slots")

    # 2. Drop Enums
    op.execute("DROP TYPE busyslotsource")
    op.execute("DROP TYPE busyslotstatus")
