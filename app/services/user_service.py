from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.user_schema import UserUpdate

from app.auth.utils import hash_password

from app.repositories.user_repository import (
    get_all_users_repo,
    get_user_by_emp_id_repo,
    delete_user_repo,
    commit_repo,
    refresh_repo,
)


# ✅ GET ALL USERS
def get_all_users_service(
    db: Session,
):

    users = get_all_users_repo(db)

    return users


# ✅ GET USER BY ID
def get_user_by_id_service(
    emp_id: int,
    db: Session,
):

    db_user = get_user_by_emp_id_repo(db, emp_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "emp_id": db_user.emp_id,
        "emp_name": db_user.emp_name,
        "emp_mail": db_user.emp_mail,
        "role": db_user.role,
    }


# ✅ DELETE USER
def delete_user_service(
    emp_id: int,
    db: Session,
):

    db_user = get_user_by_emp_id_repo(db, emp_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_user_repo(db, db_user)

    return {"message": "User deleted"}


# ✅ UPDATE USER
def update_user_service(
    emp_id: int,
    user: UserUpdate,
    db: Session,
):

    db_user = get_user_by_emp_id_repo(db, emp_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ update fields
    if user.emp_name is not None:
        db_user.emp_name = user.emp_name

    if user.emp_mail is not None:
        db_user.emp_mail = user.emp_mail

    if user.password is not None:
        db_user.password = hash_password(user.password)

    if user.role is not None:
        db_user.role = user.role

    commit_repo(db)

    refresh_repo(db, db_user)

    return {
        "message": "User updated successfully",
        "emp_id": db_user.emp_id,
        "emp_name": db_user.emp_name,
        "emp_mail": db_user.emp_mail,
        "role": db_user.role,
    }
