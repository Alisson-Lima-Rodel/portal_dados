"""Serviço de conexões externas — CRUD com criptografia Fernet.

Quando o usuário cadastra uma conexão (Fabric, Oracle, Postgres):
  - A senha é CRIPTOGRAFADA antes de salvar no banco
  - A senha NUNCA é retornada nas respostas da API
  - Só é DESCRIPTOGRAFADA internamente quando o back-end precisa conectar
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Conexao
from app.utils.crypto import decrypt_value, encrypt_value


async def create_connection(
    db: AsyncSession,
    nome: str,
    tipo: str,
    host: str,
    porta: int,
    database: str,
    usuario: str,
    senha: str,
) -> Conexao:
    conexao = Conexao(
        nome=nome,
        tipo=tipo,
        host=host,
        porta=porta,
        database=database,
        usuario=usuario,
        senha_criptografada=encrypt_value(senha),
    )
    db.add(conexao)
    await db.flush()
    return conexao


async def update_connection(db: AsyncSession, conexao: Conexao, **kwargs) -> Conexao:
    for field, value in kwargs.items():
        if value is None:
            continue
        if field == "senha":
            conexao.senha_criptografada = encrypt_value(value)
        else:
            setattr(conexao, field, value)
    await db.flush()
    return conexao


async def get_connection(db: AsyncSession, connection_id: int) -> Conexao | None:
    result = await db.execute(select(Conexao).where(Conexao.id == connection_id))
    return result.scalar_one_or_none()


async def list_connections(db: AsyncSession) -> list[Conexao]:
    result = await db.execute(select(Conexao).order_by(Conexao.id))
    return list(result.scalars().all())


async def delete_connection(db: AsyncSession, conexao: Conexao) -> None:
    await db.delete(conexao)
    await db.flush()


def get_decrypted_password(conexao: Conexao) -> str:
    return decrypt_value(conexao.senha_criptografada)
