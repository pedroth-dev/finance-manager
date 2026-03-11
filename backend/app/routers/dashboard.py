from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Transaction, Category
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    m = month if month is not None else today.month
    y = year if year is not None else today.year

    # Receitas e despesas do mês
    receitas_mes = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "receita",
            func.extract("month", Transaction.date) == m,
            func.extract("year", Transaction.date) == y,
        )
        .scalar()
        or Decimal("0")
    )
    despesas_mes = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "despesa",
            func.extract("month", Transaction.date) == m,
            func.extract("year", Transaction.date) == y,
        )
        .scalar()
        or Decimal("0")
    )
    saldo_mes = receitas_mes - despesas_mes

    # Despesas por categoria (mês)
    por_categoria_q = (
        db.query(Category.name, Category.color, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "despesa",
            func.extract("month", Transaction.date) == m,
            func.extract("year", Transaction.date) == y,
        )
        .group_by(Category.id, Category.name, Category.color)
    )
    por_categoria = [
        {"name": r.name, "color": r.color or "#6B7280", "total": float(r.total)}
        for r in por_categoria_q
    ]

    # Evolução mensal (últimos 6 meses)
    evolucao = []
    for i in range(6):
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

    # Últimas 10 transações
    ultimas = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(10)
        .all()
    )
    ultimas_transacoes = [
        {
            "id": t.id,
            "description": t.description,
            "amount": float(t.amount),
            "type": t.type,
            "date": t.date.isoformat(),
        }
        for t in ultimas
    ]

    return {
        "receitas_mes": float(receitas_mes),
        "despesas_mes": float(despesas_mes),
        "saldo_mes": float(saldo_mes),
        "por_categoria": por_categoria,
        "evolucao_mensal": evolucao,
        "ultimas_transacoes": ultimas_transacoes,
        "month": m,
        "year": y,
    }
