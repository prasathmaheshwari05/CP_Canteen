from pydantic import BaseModel
from datetime import date
from typing import List


class TodayMenuCreate(BaseModel):  # ✅ ADD THIS
    menu_ids: List[int]


class TodayMenuUpdate(BaseModel):
    menu_id: int


class TodayMenuResponse(BaseModel):
    id: int
    menu_id: int
    date: date

    class Config:
        from_attributes = True
