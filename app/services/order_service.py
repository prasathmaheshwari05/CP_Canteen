from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Order, OrderItem, Menu, User

from app.schemas.order_schema import OrderCreate, OrderPut

from datetime import date, datetime, time, timedelta
from dotenv import load_dotenv
import pytz, os

load_dotenv()
BASE_URL = os.getenv("BASE_URL")
IST = pytz.timezone("Asia/Kolkata")


def generate_qr(order_id: int):

    qr_url = f"{BASE_URL}/api/public/order/{order_id}"

    return qr_url


def create_order_service(
    request: OrderCreate,
    db: Session,
    current_user: User,
):

    if not request.items:
        raise HTTPException(status_code=400, detail="No items selected")

    today = date.today()

    requested_categories = set()

    # ✅ get categories
    for item in request.items:

        menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu ID {item.menu_id} not found"
            )

        requested_categories.add(menu.category)

    now = datetime.now(pytz.utc).astimezone(IST)

    current_time = now.time()

    normalized_categories = {c.strip().lower() for c in requested_categories}

    # ❌ prevent lunch+dinner together
    if len(normalized_categories) > 1:
        raise HTTPException(
            status_code=400,
            detail="You cannot order Lunch and Dinner together",
        )

    category = list(normalized_categories)[0]

    # ✅ lunch timing
    if category == "lunch":

        order_date = today + timedelta(days=1)

        if not (time(10, 0) <= current_time <= time(22, 0)):
            raise HTTPException(
                status_code=400,
                detail="Lunch can be ordered only between 10 AM and 10 PM",
            )

    # ✅ dinner timing
    elif category == "dinner":

        order_date = today

        if not (time(9, 0) <= current_time <= time(16, 0)):
            raise HTTPException(
                status_code=400,
                detail="Dinner can be ordered only between 9 AM and 4 PM",
            )

    else:
        raise HTTPException(status_code=400, detail="Invalid category")

    # ✅ existing orders
    existing_orders = (
        db.query(Order)
        .filter(
            Order.user_id == current_user.id,
            Order.order_date == order_date,
        )
        .all()
    )

    # ✅ duplicate check
    for order in existing_orders:

        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

        for item in items:

            menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

            if menu and menu.category.strip().lower() in normalized_categories:

                raise HTTPException(
                    status_code=400,
                    detail=f"You already ordered {menu.category} for this date",
                )

    total_amount = 0

    # ✅ create order
    new_order = Order(user_id=current_user.id, status="pending", order_date=order_date)

    db.add(new_order)

    db.flush()

    # ✅ add items
    for item in request.items:

        menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu ID {item.menu_id} not found"
            )

        if not menu.available:
            raise HTTPException(status_code=400, detail=f"{menu.name} not available")

        total_amount += menu.price * item.quantity

        order_item = OrderItem(
            order_id=new_order.id, menu_id=item.menu_id, quantity=item.quantity
        )

        db.add(order_item)

    new_order.total_amount = total_amount

    # ✅ generate qr
    qr_path = generate_qr(new_order.id)

    new_order.qr_code = qr_path

    db.commit()

    db.refresh(new_order)

    items = db.query(OrderItem).filter(OrderItem.order_id == new_order.id).all()

    return {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "total_amount": new_order.total_amount,
        "status": new_order.status,
        "created_at": new_order.created_at,
        "items": items,
        "qr_code": qr_path,
    }


def replace_order_service(
    order_id: int,
    request: OrderPut,
    db: Session,
    current_user: User,
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order cannot be modified")

    # ✅ delete old items
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

    total_amount = 0

    # ✅ add new items
    for item in request.items:

        menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu {item.menu_id} not found"
            )

        if not menu.available:
            raise HTTPException(status_code=400, detail=f"{menu.name} not available")

        total_amount += menu.price * item.quantity

        db.add(
            OrderItem(
                order_id=order_id,
                menu_id=item.menu_id,
                quantity=item.quantity,
            )
        )

    order.total_amount = total_amount

    if request.status is not None:
        order.status = request.status

    # ✅ regenerate QR
    qr_path = generate_qr(order.id)

    # ✅ save QR into DB
    order.qr_code = qr_path

    db.commit()

    db.refresh(order)

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": items,
        "qr_code": qr_path,
    }


def get_my_orders_service(
    db: Session,
    current_user: User,
):

    orders = db.query(Order).filter(Order.user_id == current_user.id).all()

    result = []

    for order in orders:

        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

        result.append(
            {
                "id": order.id,
                "user_id": order.user_id,
                "total_amount": order.total_amount,
                "created_at": order.created_at,
                "status": order.status or "pending",
                "items": items,
                "qr_code": order.qr_code,
            }
        )

    return result


def get_all_orders_service(
    db: Session,
):

    orders = db.query(Order).all()

    result = []

    for order in orders:

        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

        result.append(
            {
                "id": order.id,
                "user_id": order.user_id,
                "total_amount": order.total_amount,
                "created_at": order.created_at,
                "status": order.status or "pending",
                "items": items,
                "qr_code": order.qr_code,
            }
        )

    return result


def admin_dashboard_service(
    db: Session,
):

    total_orders = db.query(Order).count()

    total_sales = db.query(func.sum(Order.total_amount)).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_sales": total_sales,
    }


def update_order_status_service(
    order_id: int,
    status: str,
    db: Session,
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status

    db.commit()

    return {"message": "Order status updated"}
