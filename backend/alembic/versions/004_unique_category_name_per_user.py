"""unique category name per user (case-insensitive, trimmed)

Revision ID: 004
Revises: 003
Create Date: 2026-03-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Normaliza trim; renomeia duplicatas (mesmo user, mesmo nome ignorando case) para liberar o índice único.
    op.execute(
        sa.text("""
            WITH numbered AS (
                SELECT id,
                       row_number() OVER (
                           PARTITION BY user_id, lower(trim(name))
                           ORDER BY id
                       ) AS n
                FROM categories
            )
            UPDATE categories AS c
            SET name = CASE
                WHEN n.n = 1 THEN trim(c.name)
                ELSE trim(c.name) || ' #' || n.n::text
            END
            FROM numbered AS n
            WHERE c.id = n.id
        """)
    )
    op.execute(
        sa.text(
            "CREATE UNIQUE INDEX ix_categories_user_lower_name "
            "ON categories (user_id, (lower(trim(name))))"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS ix_categories_user_lower_name"))
