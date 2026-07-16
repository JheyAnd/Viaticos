"""make_usuario_id_nullable

Revision ID: 29c599fbc624
Revises: 158f6900310e
Create Date: 2026-07-08 11:04:25.813387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '29c599fbc624'
down_revision: Union[str, Sequence[str], None] = '158f6900310e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('legalizaciones', schema=None) as batch_op:
        batch_op.alter_column('usuario_id',
               existing_type=sa.Integer(),
               nullable=True)
        # Drop existing constraint
        try:
            batch_op.drop_constraint('legalizaciones_ibfk_1', type_='foreignkey')
        except Exception:
            pass
        # Create new constraint with SET NULL
        batch_op.create_foreign_key('fk_legalizaciones_users', 'users', ['usuario_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('legalizaciones', schema=None) as batch_op:
        # Drop SET NULL constraint
        try:
            batch_op.drop_constraint('fk_legalizaciones_users', type_='foreignkey')
        except Exception:
            pass
        # Recreate CASCADE constraint
        batch_op.create_foreign_key('legalizaciones_ibfk_1', 'users', ['usuario_id'], ['id'], ondelete='CASCADE')
        batch_op.alter_column('usuario_id',
               existing_type=sa.Integer(),
               nullable=False)
