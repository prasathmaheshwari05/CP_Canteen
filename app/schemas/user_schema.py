from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    emp_id: int
    emp_name: str
    emp_mail: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    emp_id: int
    password: str


# ✅ NEW → for update
class UserUpdate(BaseModel):
    emp_name: Optional[str] = None
    emp_mail: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
