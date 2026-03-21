"""Relatórios: mensal por categoria e comparativo entre meses."""
from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
import csv
import io

from app.core.database import get_db
from app.models import User, Transaction, Category
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly")
def report_monthly_by_category(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Relatório mensal: totais e despesas por categoria."""
    receitas = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "receita",
            func.extract("month", Transaction.date) == month,
            func.extract("year", Transaction.date) == year,
        )
        .scalar()
        or Decimal("0")
    )
    despesas = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "despesa",
            func.extract("month", Transaction.date) == month,
            func.extract("year", Transaction.date) == year,
        )
        .scalar()
        or Decimal("0")
    )
    por_categoria = (
        db.query(Category.name, Category.color, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "despesa",
            func.extract("month", Transaction.date) == month,
            func.extract("year", Transaction.date) == year,
        )
        .group_by(Category.id, Category.name, Category.color)
    )
    categories = [
        {"name": r.name, "color": r.color or "#6B7280", "total": float(r.total)}
        for r in por_categoria
    ]
    return {
        "month": month,
        "year": year,
        "receitas": float(receitas),
        "despesas": float(despesas),
        "saldo": float(receitas - despesas),
        "por_categoria": categories,
    }


@router.get("/comparative")
def report_comparative(
    months: int = Query(6, ge=1, le=24),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Comparativo entre meses: receitas, despesas e saldo por mês."""
    today = date.today()
    y = year if year is not None else today.year
    m = today.month
    evolucao = []
    for i in range(months):
        mm = m - i
        yy = y
        if mm < 1:
            mm += 12
            yy -= 1
        rec = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == "receita",
                func.extract("month", Transaction.date) == mm,
                func.extract("year", Transaction.date) == yy,
            )
            .scalar()
            or Decimal("0")
        )
        desp = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == "despesa",
                func.extract("month", Transaction.date) == mm,
                func.extract("year", Transaction.date) == yy,
            )
            .scalar()
            or Decimal("0")
        )
        evolucao.append({
            "month": int(mm),
            "year": int(yy),
            "receitas": float(rec),
            "despesas": float(desp),
            "saldo": float(rec - desp),
        })
    evolucao.reverse()
    return {"months": evolucao}
