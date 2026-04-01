from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import check_permission, get_current_user
from app.models.models import User, Widget
from app.schemas.schemas import WidgetCreate, WidgetRead, WidgetUpdate

router = APIRouter(prefix="/widgets", tags=["widgets"])


@router.get("/{widget_id}", response_model=WidgetRead)
async def get_widget(
    widget_id: int,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Widget).where(Widget.id == widget_id))
    widget = result.scalar_one_or_none()
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget não encontrado")
    return widget


@router.put("/{widget_id}", response_model=WidgetRead)
async def update_widget(
    widget_id: int,
    body: WidgetUpdate,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Widget).where(Widget.id == widget_id))
    widget = result.scalar_one_or_none()
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget não encontrado")
    _WIDGET_UPDATE_FIELDS = {"tipo", "query_service_key", "parametros", "posicao_grid"}
    for field, value in body.model_dump(exclude_unset=True).items():
        if field in _WIDGET_UPDATE_FIELDS:
            setattr(widget, field, value)
    await db.flush()
    return widget


@router.delete("/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget(
    widget_id: int,
    _user: User = Depends(check_permission("edit_dashboard")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Widget).where(Widget.id == widget_id))
    widget = result.scalar_one_or_none()
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget não encontrado")
    await db.delete(widget)
    await db.flush()
