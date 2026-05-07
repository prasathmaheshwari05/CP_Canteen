from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependency import get_db
from app.db.models import Status
from app.schemas.status_schema import StatusCreate, StatusResponse

from typing import List

router = APIRouter()


# ✅ CREATE STATUS
@router.post("/status", response_model=StatusResponse)
def create_status(
    request: StatusCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Status).filter(Status.status_name == request.status_name).first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Status already exists")

    new_status = Status(
        status_name=request.status_name,
        type=request.type,
    )

    db.add(new_status)
    db.commit()
    db.refresh(new_status)

    return new_status


# ✅ GET ALL STATUS
@router.get("/status", response_model=List[StatusResponse])
def get_status(
    db: Session = Depends(get_db),
):
    return db.query(Status).all()


# ✅ GET SINGLE STATUS
@router.get("/status/{status_id}", response_model=StatusResponse)
def get_single_status(
    status_id: int,
    db: Session = Depends(get_db),
):
    status = db.query(Status).filter(Status.id == status_id).first()

    if not status:
        raise HTTPException(status_code=404, detail="Status not found")

    return status


# ✅ UPDATE STATUS
@router.put("/status/{status_id}", response_model=StatusResponse)
def update_status(
    status_id: int,
    request: StatusCreate,
    db: Session = Depends(get_db),
):
    status = db.query(Status).filter(Status.id == status_id).first()

    if not status:
        raise HTTPException(status_code=404, detail="Status not found")

    status.status_name = request.status_name
    status.type = request.type

    db.commit()
    db.refresh(status)

    return status


# ✅ DELETE STATUS
@router.delete("/status/{status_id}")
def delete_status(
    status_id: int,
    db: Session = Depends(get_db),
):
    status = db.query(Status).filter(Status.id == status_id).first()

    if not status:
        raise HTTPException(status_code=404, detail="Status not found")

    db.delete(status)
    db.commit()

    return {"message": "Status deleted successfully"}
