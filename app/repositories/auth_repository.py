from sqlalchemy.orm import Session

from app.db.models import User


# ✅ GET USER BY EMP_ID
def get_user_by_emp_id_repo(db: Session, emp_id: str):

    return db.query(User).filter(User.emp_id == emp_id).first()


# ✅ CREATE USER
def create_user_repo(db: Session, user_data):

    db.add(user_data)
    db.commit()
    db.refresh(user_data)

    return user_data


# ✅ SAVE TOKEN
def save_user_token_repo(db: Session, user, token: str):

    user.active_token = token

    db.commit()


# ✅ REMOVE TOKEN
def remove_user_token_repo(db: Session, user):

    user.active_token = None

    db.commit()
