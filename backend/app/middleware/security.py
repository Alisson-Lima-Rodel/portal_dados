"""Middleware de segurança — intercepta TODA requisição antes de chegar ao endpoint.

O que este middleware faz (em ordem):

  1. A requisição é para /health, /docs, /auth/login? → Deixa passar (rota pública)

  2. Tem token JWT válido no header? → Deixa passar (usuário autenticado)

  3. Não tem token? Verifica duas condições:
     a. O IP é da intranet? (10.x.x.x, 192.168.x.x, etc.)
     b. A rota é de um dashboard público? (is_public=True)
     Se AMBAS = sim → Deixa passar
     Se não → Bloqueia com 401 (Autenticação necessária)

Isso permite que TVs/painéis na empresa mostrem dashboards públicos sem login.

Segurança de IP:
  - Usa X-Forwarded-For apenas se o request.client.host é um proxy confiável
  - Isso previne spoofing de IP via header
"""
import ipaddress
import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.security import decode_token
from app.models.models import Dashboard

logger = logging.getLogger("app.middleware.security")

# Rotas que NUNCA precisam de autenticação
PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/auth/login", "/auth/refresh"}


def _get_real_ip(request: Request) -> str:
    """Obtém o IP real do cliente, respeitando X-Forwarded-For somente de proxies confiáveis."""
    direct_ip = request.client.host if request.client else "0.0.0.0"
    # Só confia no X-Forwarded-For se a requisição vem de um proxy confiável
    if direct_ip in settings.TRUSTED_PROXY_IPS:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            # O primeiro IP da lista é o cliente real
            return forwarded.split(",")[0].strip()
    return direct_ip


def _is_intranet(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        for cidr in settings.ALLOWED_INTRANET_CIDRS:
            if ip in ipaddress.ip_network(cidr, strict=False):
                return True
    except ValueError:
        pass
    return False


class IntranetSecurityMiddleware(BaseHTTPMiddleware):
    """
    Rotas sem JWT:
    - Se IP da Intranet + dashboard público → permitir
    - Senão → 401
    """

    async def dispatch(self, request: Request, call_next):
        # CORS preflight (OPTIONS) deve sempre passar
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Rotas sempre públicas
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Verificar se há token JWT
        auth_header = request.headers.get("authorization", "")
        has_token = auth_header.lower().startswith("bearer ") and len(auth_header) > 7

        if has_token:
            token = auth_header.split(" ", 1)[1]
            payload = decode_token(token)
            if payload and payload.get("type") == "access":
                return await call_next(request)

        # Sem token válido: verificar se é intranet + dashboard público
        client_ip = _get_real_ip(request)

        if _is_intranet(client_ip) and path.startswith("/dashboards/"):
            # Verificar se é dashboard público
            parts = path.split("/")
            if len(parts) >= 3:
                try:
                    dashboard_id = int(parts[2])
                    async with async_session_factory() as db:
                        result = await db.execute(
                            select(Dashboard.is_public).where(Dashboard.id == dashboard_id)
                        )
                        is_public = result.scalar_one_or_none()
                        if is_public:
                            return await call_next(request)
                except (ValueError, Exception):
                    pass

        # Rotas que requerem autenticação
        if not has_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Autenticação necessária", "error_code": "UNAUTHORIZED", "status_code": 401},
            )

        return await call_next(request)
