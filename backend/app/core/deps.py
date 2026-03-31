"""Dependências de autenticação e autorização do FastAPI.

O que são "dependências" (Depends) no FastAPI?
  São funções que o FastAPI executa ANTES do endpoint.
  Servem para extrair e validar dados comuns (token, permissão, etc.)

Funções disponíveis:
  - get_current_user: extrai o token JWT do header → busca o usuário no banco
  - check_permission("nome"): verifica se o grupo do usuário tem a permissão
  - get_optional_user: como get_current_user, mas retorna None se não tiver token

Como usar nos endpoints (routers):

  @router.get("/minha-rota")
  async def meu_endpoint(user: User = Depends(get_current_user)):
      # 'user' já é o usuário autenticado — se token inválido, dá 401 automaticamente
      return {"nome": user.nome}

  @router.post("/admin-only")
  async def admin_endpoint(user: User = Depends(check_permission("manage_users"))):
      # Só chega aqui se o usuário tiver a permissão "manage_users"
      ...
"""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User

# HTTPBearer extrai automaticamente o token do header "Authorization: Bearer xxx"
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    result = await db.execute(
        select(User).options(selectinload(User.grupo)).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None or not user.ativo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inativo ou não encontrado")

    return user


def check_permission(permissao: str):
    async def _check(current_user: User = Depends(get_current_user)):
        if current_user.grupo is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem grupo de acesso")
        if permissao not in (current_user.grupo.permissoes or []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão '{permissao}' necessária",
            )
        return current_user
    return _check


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Retorna o usuário se houver token válido, senão None."""
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    result = await db.execute(
        select(User).options(selectinload(User.grupo)).where(User.id == int(user_id))
    )
    return result.scalar_one_or_none()
