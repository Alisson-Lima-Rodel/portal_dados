"""Endpoints de conexões externas (Fabric, Oracle, Postgres).

Todas as rotas exigem permissão 'manage_connections'.
As senhas são criptografadas com Fernet ao salvar e NUNCA retornadas na API.

GET    /connections          → Listar conexões
POST   /connections          → Criar conexão
GET    /connections/{id}     → Detalhes
PUT    /connections/{id}     → Atualizar
DELETE /connections/{id}     → Excluir
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import check_permission
from app.models.models import Conexao, User
from app.schemas.schemas import ConexaoCreate, ConexaoRead, ConexaoUpdate
from app.services.connection_service import (
    create_connection,
    delete_connection,
    get_connection,
    list_connections,
    update_connection,
)

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=list[ConexaoRead])
async def list_conn(
    _user: User = Depends(check_permission("manage_connections")),
    db: AsyncSession = Depends(get_db),
):
    return await list_connections(db)


@router.post("", response_model=ConexaoRead, status_code=status.HTTP_201_CREATED)
async def create_conn(
    body: ConexaoCreate,
    _user: User = Depends(check_permission("manage_connections")),
    db: AsyncSession = Depends(get_db),
):
    conexao = await create_connection(
        db, body.nome, body.tipo, body.host, body.porta, body.database, body.usuario, body.senha
    )
    return conexao


@router.get("/{connection_id}", response_model=ConexaoRead)
async def get_conn(
    connection_id: int,
    _user: User = Depends(check_permission("manage_connections")),
    db: AsyncSession = Depends(get_db),
):
    conexao = await get_connection(db, connection_id)
    if conexao is None:
        raise HTTPException(status_code=404, detail="Conexão não encontrada")
    return conexao


@router.put("/{connection_id}", response_model=ConexaoRead)
async def update_conn(
    connection_id: int,
    body: ConexaoUpdate,
    _user: User = Depends(check_permission("manage_connections")),
    db: AsyncSession = Depends(get_db),
):
    conexao = await get_connection(db, connection_id)
    if conexao is None:
        raise HTTPException(status_code=404, detail="Conexão não encontrada")
    conexao = await update_connection(db, conexao, **body.model_dump(exclude_unset=True))
    return conexao


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conn(
    connection_id: int,
    _user: User = Depends(check_permission("manage_connections")),
    db: AsyncSession = Depends(get_db),
):
    conexao = await get_connection(db, connection_id)
    if conexao is None:
        raise HTTPException(status_code=404, detail="Conexão não encontrada")
    await delete_connection(db, conexao)
