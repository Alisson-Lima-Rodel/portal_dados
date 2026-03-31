"""Endpoints de usuários e layout pessoal (Homebroker).

GET    /users/me          → Dados do usuário logado
GET    /users/me/layout    → Layout pessoal dos widgets
PUT    /users/me/layout    → Salvar posição dos widgets (via react-grid-layout)
GET    /users              → Listar todos (manage_users)
POST   /users              → Criar usuário (manage_users)
GET    /users/{id}         → Buscar por ID (manage_users)
PUT    /users/{id}         → Atualizar (manage_users)
DELETE /users/{id}         → Excluir (manage_users)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import check_permission, get_current_user
from app.core.security import hash_password
from app.models.models import PreferenciasUsuario, User
from app.schemas.schemas import LayoutRead, LayoutUpdate, UserCreate, UserRead, UserUpdate
from app.services.auth_service import create_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/layout", response_model=LayoutRead)
async def get_layout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == current_user.id)
    )
    pref = result.scalar_one_or_none()
    if pref is None:
        return {"layout_json": {}}
    return pref


@router.put("/me/layout", response_model=LayoutRead)
async def update_layout(
    body: LayoutUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == current_user.id)
    )
    pref = result.scalar_one_or_none()
    if pref is None:
        pref = PreferenciasUsuario(usuario_id=current_user.id, layout_json=body.layout_json)
        db.add(pref)
    else:
        pref.layout_json = body.layout_json
    await db.flush()
    return pref


@router.get("", response_model=list[UserRead])
async def list_users(
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).options(selectinload(User.grupo)).order_by(User.id))
    return list(result.scalars().all())


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    body: UserCreate,
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user = await create_user(db, body.nome, body.email, body.senha, body.ativo, body.grupo_id)
    return user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).options(selectinload(User.grupo)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: UserUpdate,
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).options(selectinload(User.grupo)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if body.nome is not None:
        user.nome = body.nome
    if body.email is not None:
        user.email = body.email
    if body.senha is not None:
        user.senha_hash = hash_password(body.senha)
    if body.ativo is not None:
        user.ativo = body.ativo
    if body.grupo_id is not None:
        user.grupo_id = body.grupo_id

    await db.flush()
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    _user: User = Depends(check_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.delete(user)
    await db.flush()
