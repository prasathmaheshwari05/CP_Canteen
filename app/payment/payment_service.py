from app.payment.razorpay_client import razorpay_client


def create_payment_order(amount: float):
    return razorpay_client.order.create(
        {"amount": int(amount * 100), "currency": "INR"}
    )


def verify_payment(data: dict):
    razorpay_client.utility.verify_payment_signature(data)
    return True
