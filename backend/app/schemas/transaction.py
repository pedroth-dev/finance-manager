from datetime import date as Date
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    icon: str = Field(default="", max_length=50)
    description: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., ge=0)
    type: str = Field(..., pattern="^(receita|despesa)$")
    date: Date
    category_id: Optional[int] = None
    is_paid: bool = True
    is_recurring: bool = False
    recurrence_frequency: Optional[str] = Field(None, pattern="^(weekly|monthly|yearly)$")
    recurrence_end_date: Optional[Date] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    icon: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[Decimal] = Field(None, ge=0)
    type: Optional[str] = Field(None, pattern="^(receita|despesa)$")
    date: Optional[Date] = None
    category_id: Optional[int] = None
    is_paid: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_frequency: Optional[str] = Field(None, pattern="^(weekly|monthly|yearly)$")
    recurrence_end_date: Optional[Date] = None


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
