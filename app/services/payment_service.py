from fastapi import HTTPException
from sqlalchemy.orm import Session

import razorpay

from app.db.models import Order, Payment

from app.schemas.payment_schema import VerifyPaymentSchema

from app.payment.payment_service import create_payment_order

from app.payment.razorpay_client import razorpay_client


# ✅ CREATE PAYMENT
def create_payment_service(
    order_id: int,
    db: Session,
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment = create_payment_order(order.total_amount)

    return payment


# ✅ VERIFY PAYMENT
def verify_payment_service(
    data: VerifyPaymentSchema,
    db: Session,
):

    try:

        order = db.query(Order).filter(Order.id == data.order_id).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status == "paid":
            raise HTTPException(status_code=400, detail="Order already paid")

        # ✅ clean input
        data.razorpay_payment_id = data.razorpay_payment_id.strip()

        data.razorpay_order_id = data.razorpay_order_id.strip()

        data.razorpay_signature = data.razorpay_signature.strip()

        # ✅ verify signature
        razorpay_client.utility.verify_payment_signature(
            {
                "razorpay_order_id": data.razorpay_order_id,
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature,
            }
        )

        # ✅ update order
        order.status = "paid"

        # ✅ save payment
        payment = Payment(
            order_id=data.order_id,
            razorpay_order_id=data.razorpay_order_id,
            razorpay_payment_id=data.razorpay_payment_id,
            razorpay_signature=data.razorpay_signature,
            status="success",
        )

        db.add(payment)

        db.commit()

        return {"message": "Payment verified & saved"}

    except razorpay.errors.SignatureVerificationError:

        raise HTTPException(status_code=400, detail="Invalid payment signature")

    except Exception as e:

        print("ERROR:", str(e))

        raise HTTPException(status_code=500, detail=str(e))
