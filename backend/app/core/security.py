"""Módulo de segurança: hashing de senhas e tokens JWT.

Conceitos:
  - Hash (bcrypt): transforma a senha em texto ilegível irreversível.
    Usamos para guardar senhas de USUÁRIOS no banco.
    'minhasenha' → '$2b$12$xyz...' (impossível voltar ao original)

  - JWT (JSON Web Token): um token assinado que identifica o usuário.
    Contém: id do usuário, email, data de expiração.
    O back-end gera o token no login; o front envia em toda requisição.

  - AuthProvider: interface que permite trocar o sistema de login
    (hoje usa banco local, no futuro pode usar LDAP/Active Directory)
"""
from __future__ import annotations

import abc
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# --------------- Hashing de senhas ---------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# --------------- JWT ---------------

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# --------------- Interface de Auth Provider ---------------

class AuthProvider(abc.ABC):
    """Interface abstrata para provider de autenticação (JWT local, LDAP, AD)."""

    @abc.abstractmethod
    async def authenticate(self, email: str, password: str) -> dict | None:
        """Retorna dados do usuário se credenciais válidas, senão None."""
        ...


class LocalAuthProvider(AuthProvider):
    """Provider padrão usando banco de dados local."""

    async def authenticate(self, email: str, password: str) -> dict | None:
        # Implementação real está em auth_service.py
        raise NotImplementedError("Use auth_service.authenticate_user diretamente")
