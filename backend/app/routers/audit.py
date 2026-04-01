"""Endpoints de auditoria / logs de acesso.

POST /audit/log   → Registra um acesso (grava em BACKGROUND para não atrasar)
                     Detecta automaticamente: IP, dispositivo, origem (intranet/externo)

GET  /audit/logs   → Consulta logs com filtros (usuário, dashboard, data)
                     Permissão: manage_users
"""
import ipaddress
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory, get_db
from app.core.deps import check_permission, get_optional_user
from app.models.models import User
from app.schemas.schemas import LogAcessoCreate, LogAcessoRead
from app.services.audit_service import create_log, list_logs

router = APIRouter(prefix="/audit", tags=["audit"])


def _detect_device(user_agent: str) -> str:
    ua = user_agent.lower()
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    if "tablet" in ua or "ipad" in ua:
        return "tablet"
    return "desktop"


def _detect_origin(ip: str) -> str:
    try:
        addr = ipaddress.ip_address(ip)
        for cidr in settings.ALLOWED_INTRANET_CIDRS:
            if addr in ipaddress.ip_network(cidr, strict=False):
                return "intranet"
    except ValueError:
        pass
    return "externo"


async def _background_log(
    usuario_id: int | None,
    ip: str,
    pagina: str,
    dashboard_id: int | None,
    acao: str,
    origem: str,
    aparelho: str,
):
    async with async_session_factory() as db:
        await create_log(db, usuario_id, ip, pagina, dashboard_id, acao, origem, aparelho)
        await db.commit()


@router.post("/log", status_code=202)
async def log_access(
    body: LogAcessoCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    user: User | None = Depends(get_optional_user),
):
    ip = request.client.host if request.client else "0.0.0.0"
    user_agent = request.headers.get("user-agent", "")
    aparelho = _detect_device(user_agent)
    origem = _detect_origin(ip)

    background_tasks.add_task(
        _background_log,
        usuario_id=user.id if user else None,
        ip=ip,
        pagina=body.pagina,
        dashboard_id=body.dashboard_id,
        acao="page_view" if body.dashboard_id is None else "dashboard_view",
        origem=origem,
        aparelho=aparelho,
    )
    return {"detail": "Log registrado em background"}


@router.get("/logs")
async def get_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    usuario_id: int | None = None,
    dashboard_id: int | None = None,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_logs(
        db, limit=limit, offset=offset,
        usuario_id=usuario_id, dashboard_id=dashboard_id,
        data_inicio=data_inicio, data_fim=data_fim,
    )
    return {
        "items": [LogAcessoRead.model_validate(i) for i in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
