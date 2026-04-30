from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models import User
from app.db.dependency import get_db

router = APIRouter()


@router.get("/roles")
def get_all_roles(db: Session = Depends(get_db)):
    roles = db.query(User.role).all()

    unique_roles = list(set([r[0].lower() for r in roles]))

    return [
        {"role_id": idx + 1, "role_name": role} for idx, role in enumerate(unique_roles)
    ]
