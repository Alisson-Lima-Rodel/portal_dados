"""Endpoints de autenticação (login e refresh de token).

POST /auth/login    → Recebe email+senha → retorna access_token + refresh_token
POST /auth/refresh  → Recebe refresh_token → retorna novo access_token

Segurança:
  - Rate limiting: máximo 5 tentativas por minuto por IP (configurável)
  - Tentativas de login falhadas são registradas no log de auditoria
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.schemas import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
)
from app.services.auth_service import authenticate_user, generate_tokens, refresh_access_token

logger = logging.getLogger("app.auth")

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.senha)
    if user is None:
        client_ip = request.client.host if request.client else "unknown"
        logger.warning("Login falhado para email=%s ip=%s", body.email, client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    return generate_tokens(user)


@router.post("/refresh", response_model=AccessTokenResponse)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access_token = await refresh_access_token(db, body.refresh_token)
    if access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado")
    return {"access_token": access_token, "token_type": "bearer"}
