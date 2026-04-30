from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import User
from app.db.dependency import get_db
from app.schemas.user_schema import UserUpdate
from app.auth.utils import hash_password

router = APIRouter()


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    # user=Depends(superadmin_required),  # ✅ only here
):
    users = db.query(User).all()
    return users


@router.get("/users/{emp_id}")
def get_user_by_id(
    emp_id: int,
    db: Session = Depends(get_db),
    # user=Depends(superadmin_required),  # optional later
):
    db_user = db.query(User).filter(User.emp_id == emp_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "emp_id": db_user.emp_id,
        "emp_name": db_user.emp_name,
        "emp_mail": db_user.emp_mail,
        "role": db_user.role,
    }


@router.delete("/users/{emp_id}")
def delete_user(
    emp_id: int,
    db: Session = Depends(get_db),
    # user=Depends(superadmin_required),
):
    db_user = db.query(User).filter(User.emp_id == emp_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()

    return {"message": "User deleted"}


@router.put("/users/{emp_id}")
def update_user(
    emp_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    # user_token=Depends(superadmin_required),
):
    db_user = db.query(User).filter(User.emp_id == emp_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Update only provided fields
    if user.emp_name is not None:
        db_user.emp_name = user.emp_name

    if user.emp_mail is not None:
        db_user.emp_mail = user.emp_mail

    if user.password is not None:
        db_user.password = hash_password(user.password)

    if user.role is not None:
        db_user.role = user.role

    db.commit()
    db.refresh(db_user)

    return {
        "message": "User updated successfully",
        "emp_id": db_user.emp_id,
        "emp_name": db_user.emp_name,
        "emp_mail": db_user.emp_mail,
        "role": db_user.role,
    }
