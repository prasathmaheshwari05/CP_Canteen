from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.models import User
from app.schemas.user_schema import UserCreate, UserLogin

from app.auth.utils import hash_password, verify_password
from app.auth.jwt_handler import create_access_token

from app.repositories.auth_repository import (
    get_user_by_emp_id_repo,
    create_user_repo,
    save_user_token_repo,
    remove_user_token_repo,
)

import re

pattern = r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$"


# ✅ REGISTER SERVICE
def register_user_service(user: UserCreate, db: Session):

    existing_user = get_user_by_emp_id_repo(db, user.emp_id)

    if existing_user:
        raise HTTPException(status_code=400, detail="Employee already exists")

    # ✅ Password validation
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

    create_user_repo(db, new_user)

    return {"message": "User created successfully"}


# ✅ LOGIN SERVICE
def login_user_service(user: UserLogin, db: Session):

    db_user = get_user_by_emp_id_repo(db, user.emp_id)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user.emp_id), "role": db_user.role})

    # ✅ Save token
    save_user_token_repo(db, db_user, token)

    return {"access_token": token, "token_type": "bearer", "role": db_user.role}


# ✅ LOGOUT SERVICE
def logout_user_service(db: Session, current_user: User):

    remove_user_token_repo(db, current_user)

    return {"message": "Logged out successfully"}
