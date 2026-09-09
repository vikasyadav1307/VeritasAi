"""add_source_url_and_title_to_analysis_results

Revision ID: e1a47b892c01
Revises: 671939c98ccd
Create Date: 2026-09-09 07:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1a47b892c01'
down_revision: Union[str, Sequence[str], None] = '671939c98ccd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add source_url and title columns to analysis_results table."""
    op.add_column(
        'analysis_results',
        sa.Column('source_url', sa.String(length=2048), nullable=True),
    )
    op.add_column(
        'analysis_results',
        sa.Column('title', sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    """Remove source_url and title columns from analysis_results table."""
    op.drop_column('analysis_results', 'title')
    op.drop_column('analysis_results', 'source_url')
