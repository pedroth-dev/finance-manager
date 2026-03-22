from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Category
from app.routers.auth import get_current_user
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])

_DUP_MSG = "Já existe uma categoria com este nome."


def _normalized_name(name: str) -> str:
    return name.strip()


def _category_name_taken(
    db: Session,
    *,
    user_id: int,
    name: str,
    exclude_id: int | None = None,
) -> bool:
    stripped = _normalized_name(name)
    if not stripped:
        return False
    key = stripped.lower()
    q = db.query(Category).filter(
        Category.user_id == user_id,
        func.lower(func.trim(Category.name)) == key,
    )
    if exclude_id is not None:
        q = q.filter(Category.id != exclude_id)
    return q.first() is not None


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Category).filter(Category.user_id == current_user.id).order_by(Category.name).all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = data.model_dump()
    payload["name"] = _normalized_name(payload["name"])
    if not payload["name"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nome da categoria não pode ser vazio.",
        )
    if _category_name_taken(db, user_id=current_user.id, name=payload["name"]):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_DUP_MSG)
    category = Category(user_id=current_user.id, **payload)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
  category_id: int,
  data: CategoryUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates:
        updates["name"] = _normalized_name(updates["name"])
        if not updates["name"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nome da categoria não pode ser vazio.",
            )
        if _category_name_taken(
            db,
            user_id=current_user.id,
            name=updates["name"],
            exclude_id=category.id,
        ):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_DUP_MSG)
    for key, value in updates.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
  category_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    db.delete(category)
    db.commit()
    return None
