from pydantic import BaseModel
from typing import List
from datetime import datetime

# ✅ ADD THIS (MISSING)
class OrderItemCreate(BaseModel):
    menu_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    menu_id: int
    quantity: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]  # ✅ now works


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]
    qr_code: str
    class Config:
        from_attributes = True
