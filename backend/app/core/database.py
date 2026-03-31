"""Conexão com o banco de dados PostgreSQL (modo assíncrono).

Conceitos importantes:
  - engine: o "motor" que gerencia a conexão com o banco
  - session: uma "conversa" com o banco (abre, faz queries, fecha)
  - Base: classe mãe de todos os modelos/tabelas (SQLAlchemy)
  - get_db: função que o FastAPI usa para injetar a session nos endpoints

Fluxo de uma requisição:
  1. FastAPI chama get_db() → cria uma session
  2. O endpoint usa a session para fazer queries
  3. Se tudo der certo → commit (salva)
  4. Se der erro → rollback (desfaz)
  5. Session é fechada automaticamente
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# pool_pre_ping=True faz o SQLAlchemy testar se a conexão está viva antes de usar
engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
