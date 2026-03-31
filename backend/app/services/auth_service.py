"""Serviço de autenticação — lógica de login, tokens e criação de usuários.

Fluxo do login:
  1. Recebe email + senha
  2. Busca usuário pelo email no banco
  3. Verifica se o hash da senha bate (bcrypt)
  4. Se ok → gera access_token (30 min) + refresh_token (7 dias)
  5. Retorna os tokens para o front

Fluxo do refresh:
  1. Front envia o refresh_token (que dura 7 dias)
  2. Back-end decodifica → verifica se é válido e se o usuário existe
  3. Gera um NOVO access_token (mais 30 min)
  4. O refresh_token antigo continua válido até expirar
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.models import User


async def authenticate_user(db: AsyncSession, email: str, senha: str) -> User | None:
    result = await db.execute(
        select(User).options(selectinload(User.grupo)).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(senha, user.senha_hash):
        return None
    if not user.ativo:
        return None
    return user


def generate_tokens(user: User) -> dict:
    data = {"sub": str(user.id), "email": user.email}
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data),
        "token_type": "bearer",
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str | None:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.ativo:
        return None
    return create_access_token({"sub": str(user.id), "email": user.email})


async def create_user(db: AsyncSession, nome: str, email: str, senha: str, ativo: bool = True, grupo_id: int | None = None) -> User:
    user = User(
        nome=nome,
        email=email,
        senha_hash=hash_password(senha),
        ativo=ativo,
        grupo_id=grupo_id,
    )
    db.add(user)
    await db.flush()
    return user
