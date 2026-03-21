import csv
import io
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Transaction
from app.routers.auth import get_current_user
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionUpdate,
    TransactionResponse,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])

SortKind = Literal["date_desc", "date_asc", "amount_desc", "amount_asc", "category_asc", "category_desc"]


def _build_transactions_query(
    db: Session,
    user_id: int,
    type_: Optional[Literal["receita", "despesa"]] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_paid: Optional[bool] = None,
    search: Optional[str] = None,
    sort: SortKind = "date_desc",
):
    q = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type_ is not None:
        q = q.filter(Transaction.type == type_)
    if category_id is not None:
        q = q.filter(Transaction.category_id == category_id)
    if date_from is not None:
        q = q.filter(Transaction.date >= date_from)
    if date_to is not None:
        q = q.filter(Transaction.date <= date_to)
    if is_paid is not None:
        q = q.filter(Transaction.is_paid == is_paid)
    if search:
        q = q.filter(Transaction.description.ilike(f"%{search.strip()}%"))
    if sort == "date_desc":
        q = q.order_by(Transaction.date.desc(), Transaction.id.desc())
    elif sort == "date_asc":
        q = q.order_by(Transaction.date.asc(), Transaction.id.asc())
    elif sort == "amount_desc":
        q = q.order_by(Transaction.amount.desc(), Transaction.id.desc())
    elif sort == "amount_asc":
        q = q.order_by(Transaction.amount.asc(), Transaction.id.asc())
    elif sort == "category_asc":
        q = q.order_by(Transaction.category_id.asc().nulls_last(), Transaction.date.desc())
    elif sort == "category_desc":
        q = q.order_by(Transaction.category_id.desc().nulls_first(), Transaction.date.desc())
    return q


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    type_: Optional[Literal["receita", "despesa"]] = Query(None, alias="type"),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_paid: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, min_length=1),
    sort: SortKind = Query("date_desc"),
    page: Optional[int] = Query(None, ge=1),
    per_page: int = Query(50, ge=1, le=100),
):
    q = _build_transactions_query(
        db, current_user.id, type_=type_, category_id=category_id,
        date_from=date_from, date_to=date_to, is_paid=is_paid, search=search, sort=sort,
    )
    total = q.count()
    if page is not None:
        offset = (page - 1) * per_page
        items = q.offset(offset).limit(per_page).all()
        return TransactionListResponse(items=items, total=total, page=page, per_page=per_page)
    items = q.all()
    return TransactionListResponse(items=items, total=total, page=1, per_page=total)


@router.get("/export/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    type_: Optional[Literal["receita", "despesa"]] = Query(None, alias="type"),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_paid: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, min_length=1),
    sort: SortKind = Query("date_desc"),
):
    q = _build_transactions_query(
        db, current_user.id, type_=type_, category_id=category_id,
        date_from=date_from, date_to=date_to, is_paid=is_paid, search=search, sort=sort,
    )
    rows = q.all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Data", "Descrição", "Tipo", "Valor", "Categoria ID", "Pago", "Recorrente"])
    for t in rows:
        w.writerow([
            t.date.isoformat(),
            t.description,
            t.type,
            str(t.amount),
            t.category_id or "",
            "Sim" if t.is_paid else "Não",
            "Sim" if t.is_recurring else "Não",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transacoes.csv"},
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = Transaction(user_id=current_user.id, **data.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    db.delete(transaction)
    db.commit()
    return None
