"""audit_fix_service_orders

Revision ID: e8b5fae30eec
Revises: de036294d298
Create Date: 2026-05-16 21:53:36.311797

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "e8b5fae30eec"
down_revision = "de036294d298"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        op.f("ix_service_orders_preferred_date_end"),
        "service_orders",
        ["preferred_date_end"],
        unique=False,
    )
    op.create_index(
        op.f("ix_service_orders_preferred_date_start"),
        "service_orders",
        ["preferred_date_start"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_service_orders_preferred_date_start"), table_name="service_orders"
    )
    op.drop_index(
        op.f("ix_service_orders_preferred_date_end"), table_name="service_orders"
    )
