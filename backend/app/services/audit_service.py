"""Serviço de auditoria — gravação e consulta de logs de acesso.

Cada acesso do usuário é registrado com:
  - Quem (usuario_id)
  - De onde (IP, origem intranet/externo)
  - Com que aparelho (desktop/tablet/mobile)
  - O que acessou (página, dashboard)
  - Quando (created_at)

A gravação é feita em BackgroundTask (não atrasa a resposta ao usuário).
"""
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import LogAcesso


async def create_log(
    db: AsyncSession,
    usuario_id: int | None,
    ip: str,
    pagina: str,
    dashboard_id: int | None,
    acao: str,
    origem: str | None = None,
    aparelho: str | None = None,
) -> LogAcesso:
    log = LogAcesso(
        usuario_id=usuario_id,
        ip=ip,
        pagina=pagina,
        dashboard_id=dashboard_id,
        acao=acao,
        origem=origem,
        aparelho=aparelho,
    )
    db.add(log)
    await db.flush()
    return log


async def list_logs(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    usuario_id: int | None = None,
    dashboard_id: int | None = None,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
) -> tuple[list[LogAcesso], int]:
    query = select(LogAcesso)
    count_q = select(func.count(LogAcesso.id))

    if usuario_id is not None:
        query = query.where(LogAcesso.usuario_id == usuario_id)
        count_q = count_q.where(LogAcesso.usuario_id == usuario_id)
    if dashboard_id is not None:
        query = query.where(LogAcesso.dashboard_id == dashboard_id)
        count_q = count_q.where(LogAcesso.dashboard_id == dashboard_id)
    if data_inicio is not None:
        query = query.where(LogAcesso.created_at >= data_inicio)
        count_q = count_q.where(LogAcesso.created_at >= data_inicio)
    if data_fim is not None:
        query = query.where(LogAcesso.created_at <= data_fim)
        count_q = count_q.where(LogAcesso.created_at <= data_fim)

    total = (await db.execute(count_q)).scalar_one()
    result = await db.execute(query.order_by(LogAcesso.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total
