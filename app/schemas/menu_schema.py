from pydantic import BaseModel
from typing import List

class MenuCreate(BaseModel):
    name: str
    price: float
    category: str
    available: bool
    images: List[str]
    description: str

class MenuUpdate(BaseModel):
    name: str
    price: float
    category: str
    available: bool
    images: List[str]
    description: str
class MenuResponse(BaseModel):
    id: int
    name: str
    price: float
    category: str
    available: bool
    images: List[str]
    description: str
    class Config:
        orm_mode = True
