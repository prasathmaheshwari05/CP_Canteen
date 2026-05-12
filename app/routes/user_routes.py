from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.dependency import get_db

from app.schemas.user_schema import UserUpdate

from app.services.user_service import (
    get_all_users_service,
    get_user_by_id_service,
    delete_user_service,
    update_user_service,
)

router = APIRouter()


# ✅ GET ALL USERS
@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
):

    return get_all_users_service(db)


# ✅ GET USER BY ID
@router.get("/users/{emp_id}")
def get_user_by_id(
    emp_id: int,
    db: Session = Depends(get_db),
):

    return get_user_by_id_service(emp_id, db)


# ✅ DELETE USER
@router.delete("/users/{emp_id}")
def delete_user(
    emp_id: int,
    db: Session = Depends(get_db),
):

    return delete_user_service(emp_id, db)


# ✅ UPDATE USER
@router.put("/users/{emp_id}")
def update_user(
    emp_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
):

    return update_user_service(emp_id, user, db)
