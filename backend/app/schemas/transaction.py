from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., ge=0)
    type: str = Field(..., pattern="^(receita|despesa)$")
    date: date
    category_id: Optional[int] = None
    is_paid: bool = True
    is_recurring: bool = False


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[Decimal] = Field(None, ge=0)
    type: Optional[str] = Field(None, pattern="^(receita|despesa)$")
    date: Optional[date] = None
    category_id: Optional[int] = None
    is_paid: Optional[bool] = None
    is_recurring: Optional[bool] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    per_page: int
