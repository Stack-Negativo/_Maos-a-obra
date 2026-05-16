"""create_provider_and_roles_tables

Revision ID: 52a1d6a8b1c4
Revises: 31d66d180cb1
Create Date: 2026-05-14 16:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "52a1d6a8b1c4"
down_revision = "31d66d180cb1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Clients table
    op.create_table(
        "clients",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Admins table
    op.create_table(
        "admins",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("access_level", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Providers table
    op.create_table(
        "providers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("rating_average", sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column("total_reviews", sa.Integer(), nullable=False),
        sa.Column("is_suspended", sa.Boolean(), nullable=False),
        sa.Column("suspended_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Providers Specialties relationship table
    op.create_table(
        "providers_specialties",
        sa.Column("provider_id", sa.UUID(), nullable=False),
        sa.Column("specialty_id", sa.UUID(), nullable=False),
        sa.Column("linked_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["providers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["specialty_id"],
            ["specialties.id"],
        ),
        sa.PrimaryKeyConstraint("provider_id", "specialty_id"),
    )


def downgrade() -> None:
    op.drop_table("providers_specialties")
    op.drop_table("providers")
    op.drop_table("admins")
    op.drop_table("clients")
