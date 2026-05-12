from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.dependency import get_db

from app.auth.dependencies import get_current_user

from app.schemas.payment_schema import VerifyPaymentSchema

from app.services.payment_service import create_payment_service, verify_payment_service

router = APIRouter()


# ✅ CREATE PAYMENT
@router.post("/create-payment/{order_id}")
def create_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return create_payment_service(order_id, db)


# ✅ VERIFY PAYMENT
@router.post("/verify-payment")
def verify_payment_api(
    data: VerifyPaymentSchema,
    db: Session = Depends(get_db),
):

    return verify_payment_service(data, db)
