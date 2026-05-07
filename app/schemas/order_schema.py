from pydantic import BaseModel
from typing import List
from datetime import datetime, date

from typing import Optional


# ✅ ADD THIS (MISSING)
class OrderItemCreate(BaseModel):
    menu_id: int
    quantity: int


class OrderPut(BaseModel):
    items: List[OrderItemCreate]
    status: Optional[str] = None


class OrderItemResponse(BaseModel):
    menu_id: int
    quantity: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]  # ✅ now works
    # order_date: date  # 🔥 ADD THIS


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]
    qr_code: Optional[str] = None

    class Config:
        from_attributes = True
