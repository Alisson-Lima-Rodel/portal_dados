"""Endpoints de dashboards, widgets e dados dos gráficos.

GET    /dashboards/catalog         → Catálogo paginado com busca e filtro por área
POST   /dashboards                 → Criar dashboard (edit_dashboard)
GET    /dashboards/{id}            → Detalhes do dashboard
PUT    /dashboards/{id}            → Atualizar (edit_dashboard)
DELETE /dashboards/{id}            → Excluir (edit_dashboard)
GET    /dashboards/{id}/data       → ⭐ DADOS DOS GRÁFICOS (com cache dinâmico)
GET    /dashboards/{id}/widgets    → Lista de widgets do dashboard
POST   /dashboards/{id}/widgets    → Criar widget (edit_dashboard)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import check_permission, get_current_user
from app.models.models import Dashboard, User, Widget
from app.schemas.schemas import (
    DashboardCreate,
    DashboardRead,
    DashboardUpdate,
    WidgetCreate,
    WidgetRead,
    WidgetUpdate,
)
from app.services.dashboard_service import get_dashboard_data, get_dashboard_widgets, list_dashboards

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("/catalog")
async def catalog(
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
    area_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_dashboards(db, limit=limit, offset=offset, search=search, area_id=area_id)
    return {"items": [DashboardRead.model_validate(d) for d in items], "total": total, "limit": limit, "offset": offset}


@router.post("", response_model=DashboardRead, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    body: DashboardCreate,
    user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    dashboard = Dashboard(
        nome=body.nome,
        descricao=body.descricao,
        is_public=body.is_public,
        taxa_atualizacao_minutos=body.taxa_atualizacao_minutos,
        area_id=body.area_id,
        criado_por=user.id,
    )
    db.add(dashboard)
    await db.flush()
    return dashboard


@router.get("/{dashboard_id}", response_model=DashboardRead)
async def get_dashboard(
    dashboard_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard não encontrado")
    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardRead)
async def update_dashboard(
    dashboard_id: int,
    body: DashboardUpdate,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard não encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(dashboard, field, value)
    await db.flush()
    return dashboard


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: int,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard não encontrado")
    await db.delete(dashboard)
    await db.flush()


@router.get("/{dashboard_id}/data")
async def dashboard_data(
    dashboard_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Dashboard não encontrado")
    data = await get_dashboard_data(db, dashboard_id)
    return data


@router.get("/{dashboard_id}/widgets", response_model=list[WidgetRead])
async def dashboard_widgets(
    dashboard_id: int,
    db: AsyncSession = Depends(get_db),
):
    widgets = await get_dashboard_widgets(db, dashboard_id)
    return widgets


# ======================== Widgets CRUD ========================

@router.post("/{dashboard_id}/widgets", response_model=WidgetRead, status_code=status.HTTP_201_CREATED)
async def create_widget(
    dashboard_id: int,
    body: WidgetCreate,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    widget = Widget(
        dashboard_id=dashboard_id,
        tipo=body.tipo,
        query_service_key=body.query_service_key,
        parametros=body.parametros,
        posicao_grid=body.posicao_grid,
    )
    db.add(widget)
    await db.flush()
    return widget


@router.put("/widgets/{widget_id}", response_model=WidgetRead)
async def update_widget(
    widget_id: int,
    body: WidgetUpdate,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Widget).where(Widget.id == widget_id))
    widget = result.scalar_one_or_none()
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget não encontrado")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(widget, field, value)
    await db.flush()
    return widget


@router.delete("/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget(
    widget_id: int,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Widget).where(Widget.id == widget_id))
    widget = result.scalar_one_or_none()
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget não encontrado")
    await db.delete(widget)
    await db.flush()
