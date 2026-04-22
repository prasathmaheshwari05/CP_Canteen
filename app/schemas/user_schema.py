from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    emp_id: int
    emp_name: str
    emp_mail: EmailStr  # ✅ email validation
    password: str  # (we will validate in logic)
    role: str  # admin or user


class UserLogin(BaseModel):
    emp_id: int
    password: str
