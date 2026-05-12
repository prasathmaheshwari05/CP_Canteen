from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import Request
from app.core.limiter import limiter
from app.db.dependency import get_db

from app.schemas.user_schema import UserCreate, UserLogin

from app.services.auth_service import (
    register_user_service,
    login_user_service,
    logout_user_service,
)

from app.auth.dependencies import get_current_user
from app.db.models import User

router = APIRouter()


# REGISTER
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user_service(user, db)


# LOGIN
@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    user: UserLogin,
    db: Session = Depends(get_db),
):
    return login_user_service(user, db)


# LOGOUT
@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logout_user_service(db, current_user)
