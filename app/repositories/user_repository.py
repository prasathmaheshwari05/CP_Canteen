from sqlalchemy.orm import Session

from app.db.models import User


# ✅ GET ALL USERS
def get_all_users_repo(db: Session):

    return db.query(User).all()


# ✅ GET USER BY EMP_ID
def get_user_by_emp_id_repo(db: Session, emp_id: int):

    return db.query(User).filter(User.emp_id == emp_id).first()


# ✅ DELETE USER
def delete_user_repo(db: Session, user):

    db.delete(user)

    db.commit()


# ✅ COMMIT
def commit_repo(db: Session):

    db.commit()


# ✅ REFRESH
def refresh_repo(db: Session, obj):

    db.refresh(obj)
