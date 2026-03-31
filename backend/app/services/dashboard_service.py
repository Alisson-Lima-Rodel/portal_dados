"""Serviço de dashboards — busca, listagem e execução de queries com cache.

Função principal: get_dashboard_data()
  É chamada pelo endpoint GET /dashboards/{id}/data
  Percorre os widgets do dashboard e executa as queries com cache.

Fluxo detalhado de get_dashboard_data:
  1. Busca o dashboard com seus widgets
  2. Calcula o TTL do cache (taxa_atualizacao_minutos × 60, ou 24h se não definido)
  3. Para cada widget nativo:
     a. Monta uma chave de cache (dashboard:id:widget:id:query_key)
     b. Tenta pegar do cache
     c. Se não tiver → busca no QUERY_REGISTRY → executa → salva no cache
  4. Retorna um dict com os resultados de todas as queries
"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cache.backend import get_cache
from app.core.config import settings
from app.models.models import Dashboard, Widget
from app.services.queries.registry import QUERY_REGISTRY


async def get_dashboard(db: AsyncSession, dashboard_id: int) -> Dashboard | None:
    result = await db.execute(
        select(Dashboard).options(selectinload(Dashboard.widgets)).where(Dashboard.id == dashboard_id)
    )
    return result.scalar_one_or_none()


async def list_dashboards(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
    area_id: int | None = None,
) -> tuple[list[Dashboard], int]:
    query = select(Dashboard)
    count_query = select(func.count(Dashboard.id))

    if search:
        query = query.where(Dashboard.nome.ilike(f"%{search}%"))
        count_query = count_query.where(Dashboard.nome.ilike(f"%{search}%"))
    if area_id is not None:
        query = query.where(Dashboard.area_id == area_id)
        count_query = count_query.where(Dashboard.area_id == area_id)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(query.offset(offset).limit(limit).order_by(Dashboard.id))
    return list(result.scalars().all()), total


async def get_dashboard_data(db: AsyncSession, dashboard_id: int) -> dict:
    """Retorna dados de todos os widgets nativos do dashboard, usando cache dinâmico."""
    dashboard = await get_dashboard(db, dashboard_id)
    if dashboard is None:
        return {}

    # Calcular TTL dinâmico
    ttl = settings.DEFAULT_CACHE_TTL_SECONDS
    if dashboard.taxa_atualizacao_minutos and dashboard.taxa_atualizacao_minutos > 0:
        ttl = dashboard.taxa_atualizacao_minutos * 60

    cache = get_cache()
    results: dict = {}

    for widget in dashboard.widgets:
        if widget.tipo != "nativo" or not widget.query_service_key:
            continue

        cache_key = f"dashboard:{dashboard_id}:widget:{widget.id}:{widget.query_service_key}"
        cached = await cache.get(cache_key)
        if cached is not None:
            results[widget.query_service_key] = cached
            continue

        query_fn = QUERY_REGISTRY.get(widget.query_service_key)
        if query_fn is None:
            results[widget.query_service_key] = {"error": f"Query '{widget.query_service_key}' não registrada"}
            continue

        data = await query_fn(params=widget.parametros or {})
        await cache.set(cache_key, data, ttl)
        results[widget.query_service_key] = data

    return results


async def get_dashboard_widgets(db: AsyncSession, dashboard_id: int) -> list[Widget]:
    result = await db.execute(
        select(Widget).where(Widget.dashboard_id == dashboard_id).order_by(Widget.id)
    )
    return list(result.scalars().all())
