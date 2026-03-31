"""Endpoint de health check — verifica se a aplicação está saudável.

GET /health → Testa conexão com banco e cache, retorna status.
Não precisa de autenticação. Útil para monitoramento e load balancers.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.backend import get_cache
from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    status_info = {"app": "ok", "database": "ok", "cache": "ok"}

    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        status_info["database"] = "error"

    try:
        cache = get_cache()
        await cache.set("__health__", "ok", 10)
        val = await cache.get("__health__")
        if val != "ok":
            status_info["cache"] = "error"
    except Exception:
        status_info["cache"] = "error"

    overall = "healthy" if all(v == "ok" for v in status_info.values()) else "degraded"
    return {"status": overall, "components": status_info}
