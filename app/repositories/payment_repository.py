from sqlalchemy.orm import Session

from app.db.models import Order, Payment


# ✅ GET ORDER BY ID
def get_order_by_id_repo(db: Session, order_id: int):

    return db.query(Order).filter(Order.id == order_id).first()


# ✅ SAVE PAYMENT
def save_payment_repo(db: Session, payment):

    db.add(payment)

    db.commit()


# ✅ COMMIT
def commit_repo(db: Session):

    db.commit()
