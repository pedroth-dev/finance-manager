from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    category_id: int
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    amount_limit: Decimal = Field(..., ge=0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: Optional[Decimal] = Field(None, ge=0)


class BudgetResponse(BudgetBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class BudgetWithSpendingResponse(BudgetResponse):
    spent: Decimal = Decimal("0")
    category_name: str = ""
    category_color: str = "#6B7280"
    alert: str = "ok"  # ok, warning (>80%), over (>=100%)
