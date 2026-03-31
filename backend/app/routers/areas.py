from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Area, User
from app.schemas.schemas import AreaCreate, AreaRead, AreaUpdate

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaRead])
async def list_areas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Area).order_by(Area.nome))
    return list(result.scalars().all())


@router.post("", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
async def create_area(
    body: AreaCreate,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    area = Area(nome=body.nome, icone=body.icone)
    db.add(area)
    await db.flush()
    return area


@router.put("/{area_id}", response_model=AreaRead)
async def update_area(
    area_id: int,
    body: AreaUpdate,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Area).where(Area.id == area_id))
    area = result.scalar_one_or_none()
    if area is None:
        raise HTTPException(status_code=404, detail="Área não encontrada")
    if body.nome is not None:
        area.nome = body.nome
    if body.icone is not None:
        area.icone = body.icone
    await db.flush()
    return area


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_area(
    area_id: int,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Area).where(Area.id == area_id))
    area = result.scalar_one_or_none()
    if area is None:
        raise HTTPException(status_code=404, detail="Área não encontrada")
    await db.delete(area)
    await db.flush()
