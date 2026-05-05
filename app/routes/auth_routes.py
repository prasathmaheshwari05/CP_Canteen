from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.dependency import get_db
from app.schemas.user_schema import UserCreate, UserLogin
from app.auth.utils import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.dependencies import superadmin_required
from app.auth.dependencies import get_current_user
import re

router = APIRouter()
pattern = r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$"


# ✅ REGISTER
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.emp_id == user.emp_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Employee already exists")

    # Optional: password validation (alphanumeric)

    if not re.match(pattern, user.password):
        raise HTTPException(
            status_code=400, detail="Password must contain letters and numbers"
        )

    new_user = User(
        emp_id=user.emp_id,
        emp_name=user.emp_name,
        emp_mail=user.emp_mail,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# ✅ LOGIN
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.emp_id == user.emp_id).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user.emp_id), "role": db_user.role})


    # ✅ SAVE TOKEN IN DB
    db_user.active_token = token
    db.commit()

    return {"access_token": token, "token_type": "bearer", "role": db_user.role}
