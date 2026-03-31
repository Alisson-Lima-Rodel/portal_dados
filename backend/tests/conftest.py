"""Configuração dos testes (fixtures).

O que são fixtures?
  São funções que preparam o ambiente antes de cada teste.
  O pytest injeta automaticamente quando o teste pede um parâmetro com o mesmo nome.

Exemplo:
  async def test_algo(self, client, auth_headers):
      # 'client' e 'auth_headers' são fixtures — já chegam prontas
      resp = await client.get("/users/me", headers=auth_headers)

Fixtures disponíveis:
  - db_session: sessão de banco SQLite em memória (limpo a cada teste)
  - client: cliente HTTP que chama a API (sem precisar de servidor rodando)
  - admin_user: cria um usuário admin no banco de teste
  - auth_headers: faz login do admin e retorna {"Authorization": "Bearer token"}

Por que SQLite em memória?
  - Não precisa de PostgreSQL rodando
  - Cada teste começa com banco limpo
  - É rápido (tudo em memória)
"""
import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.models import GrupoAcesso, User

# Banco de teste SQLite in-memory com aiosqlite
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_test = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_test() as session:
        yield session


async def override_get_db():
    async with async_session_test() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    grupo = GrupoAcesso(
        nome="admin",
        permissoes=["view_dashboard", "edit_dashboard", "manage_users", "manage_connections"],
    )
    db_session.add(grupo)
    await db_session.flush()

    user = User(
        nome="Admin Teste",
        email="admin@test.com",
        senha_hash=hash_password("admin123"),
        ativo=True,
        grupo_id=grupo.id,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, admin_user: User) -> dict:
    resp = await client.post("/auth/login", json={"email": "admin@test.com", "senha": "admin123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
