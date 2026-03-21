from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Budget, Transaction, Category
from app.routers.auth import get_current_user
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithSpendingResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetWithSpendingResponse])
def list_budgets(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == month, Budget.year == year)
        .all()
    )
    result = []
    for b in budgets:
        cat = db.query(Category).filter(Category.id == b.category_id).first()
        start = date(b.year, b.month, 1)
        if b.month == 12:
            end = date(b.year, 12, 31)
        else:
            end = date(b.year, b.month + 1, 1) - timedelta(days=1)
        spent = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == "despesa",
                Transaction.category_id == b.category_id,
                Transaction.date >= start,
                Transaction.date <= end,
            )
            .scalar()
        ) or Decimal("0")
        limit = b.amount_limit
        if limit and limit > 0:
            pct = float(spent) / float(limit)
            if pct >= 1:
                alert = "over"
            elif pct >= 0.8:
                alert = "warning"
            else:
                alert = "ok"
        else:
            alert = "ok"
        result.append(
            BudgetWithSpendingResponse(
                id=b.id,
                user_id=b.user_id,
                category_id=b.category_id,
                month=b.month,
                year=b.year,
                amount_limit=b.amount_limit,
                spent=spent,
                category_name=cat.name if cat else "",
                category_color=cat.color if cat else "#6B7280",
                alert=alert,
            )
        )
    return result


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category_id == data.category_id,
            Budget.month == data.month,
            Budget.year == data.year,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe orçamento para esta categoria neste mês/ano.",
        )
    cat = db.query(Category).filter(Category.id == data.category_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    budget = Budget(user_id=current_user.id, **data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orçamento não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orçamento não encontrado")
    db.delete(budget)
    db.commit()
    return None
