from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Order, OrderItem, Menu


# ✅ GET MENU BY ID
def get_menu_by_id_repo(db: Session, menu_id: int):

    return db.query(Menu).filter(Menu.id == menu_id).first()


# ✅ CREATE ORDER
def create_order_repo(db: Session, user_id: int, order_date):

    new_order = Order(user_id=user_id, status="pending", order_date=order_date)

    db.add(new_order)

    db.flush()

    return new_order


# ✅ ADD ORDER ITEM
def add_order_item_repo(db: Session, order_id: int, menu_id: int, quantity: int):

    order_item = OrderItem(order_id=order_id, menu_id=menu_id, quantity=quantity)

    db.add(order_item)


# ✅ GET USER ORDERS
def get_user_orders_repo(db: Session, user_id: int, order_date):

    return (
        db.query(Order)
        .filter(Order.user_id == user_id, Order.order_date == order_date)
        .all()
    )


# ✅ GET ORDER ITEMS
def get_order_items_repo(db: Session, order_id: int):

    return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()


# ✅ GET ORDER BY ID
def get_order_by_id_repo(db: Session, order_id: int):

    return db.query(Order).filter(Order.id == order_id).first()


# ✅ DELETE ORDER ITEMS
def delete_order_items_repo(db: Session, order_id: int):

    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()


# ✅ COMMIT
def commit_repo(db: Session):

    db.commit()


# ✅ REFRESH
def refresh_repo(db: Session, obj):

    db.refresh(obj)


# ✅ GET ALL ORDERS
def get_all_orders_repo(db: Session):

    return db.query(Order).all()


# ✅ TOTAL ORDERS
def get_total_orders_repo(db: Session):

    return db.query(Order).count()


# ✅ TOTAL SALES
def get_total_sales_repo(db: Session):

    return db.query(func.sum(Order.total_amount)).scalar() or 0


# ✅ GET EXISTING ORDERS
def get_existing_orders_repo(db: Session, user_id: int, order_date):


    return (
        db.query(Order)
        .filter(Order.user_id == user_id, Order.order_date == order_date)
        .all()
    )
# ✅ GET MY ORDERS
def get_my_orders_repo(db: Session, user_id: int):

    return db.query(Order).filter(Order.user_id == user_id).all()
