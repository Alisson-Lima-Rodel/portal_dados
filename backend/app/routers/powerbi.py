"""Endpoint de integração Power BI Embed.

GET /dashboards/{id}/embed-token
  1. Busca os widgets do tipo 'powerbi' do dashboard
  2. Lê o report_id dos parâmetros do widget
  3. Autentica no Azure AD (client credentials)
  4. Gera um Embed Token via Power BI REST API
  5. Retorna o token para o front embutir o relatório
"""
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import Dashboard, User
from app.services.powerbi_service import get_powerbi_embed_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter(prefix="/dashboards", tags=["powerbi"])


@router.get("/{dashboard_id}/embed-token")
async def embed_token(
    dashboard_id: int,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard não encontrado")

    # Os widgets Power BI armazenam report_id e dataset_id nos parametros
    from sqlalchemy import select as sel
    from app.models.models import Widget
    widget_result = await db.execute(
        sel(Widget).where(Widget.dashboard_id == dashboard_id, Widget.tipo == "powerbi")
    )
    widget = widget_result.scalars().first()
    if widget is None or not widget.parametros:
        raise HTTPException(status_code=404, detail="Nenhum widget Power BI encontrado")

    report_id = widget.parametros.get("report_id", "")
    dataset_id = widget.parametros.get("dataset_id")

    try:
        token_data = await get_powerbi_embed_token(report_id, dataset_id)
        return token_data
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao obter embed token: {exc}")
