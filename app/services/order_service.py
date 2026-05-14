from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.db.models import  User
from app.utils.qr_generator import generate_qr
from app.schemas.order_schema import OrderCreate, OrderPut

from datetime import date, datetime, time, timedelta
from dotenv import load_dotenv
import pytz, os
from app.repositories.order_repository import (
    get_menu_by_id_repo,
    get_order_items_repo,
    commit_repo,
    refresh_repo,
    create_order_repo,
    add_order_item_repo,
    get_existing_orders_repo,
    get_order_by_id_repo,
    delete_order_items_repo,
    get_all_orders_repo,
    get_total_orders_repo,
    get_total_sales_repo,
    get_my_orders_repo,
)
from app.core.config import IST




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

        menu = get_menu_by_id_repo(db,item.menu_id)

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
    existing_orders = get_existing_orders_repo(db, current_user.id, order_date)

    # ✅ duplicate check
    for order in existing_orders:

        items = get_order_items_repo(db,order.id)

        for item in items:

            menu = get_menu_by_id_repo(db,item.menu_id)

            if menu and menu.category.strip().lower() in normalized_categories:

                raise HTTPException(
                    status_code=400,
                    detail=f"You already ordered {menu.category} for this date",
                )

    total_amount = 0

    # ✅ create order
    new_order = create_order_repo(db, current_user.id, order_date)

    # ✅ add items
    for item in request.items:

        menu = get_menu_by_id_repo(db,item.menu_id)

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu ID {item.menu_id} not found"
            )

        if not menu.available:
            raise HTTPException(status_code=400, detail=f"{menu.name} not available")

        total_amount += menu.price * item.quantity

        add_order_item_repo(db, new_order.id, item.menu_id, item.quantity)

    new_order.total_amount = total_amount

    # ✅ generate qr
    qr_path = generate_qr(new_order.id)

    new_order.qr_code = qr_path

    commit_repo(db)

    refresh_repo(db, new_order)

    items = get_order_items_repo(db, new_order.id)

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

    order = get_order_by_id_repo(db, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order cannot be modified")

    # ✅ delete old items
    delete_order_items_repo(db, order_id)

    total_amount = 0

    # ✅ add new items
    for item in request.items:

        menu = get_menu_by_id_repo(db,item.menu_id)

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu {item.menu_id} not found"
            )

        if not menu.available:
            raise HTTPException(status_code=400, detail=f"{menu.name} not available")

        total_amount += menu.price * item.quantity

        add_order_item_repo(db, order_id, item.menu_id, item.quantity)

    order.total_amount = total_amount

    if request.status is not None:
        order.status = request.status

    # ✅ regenerate QR
    qr_path = generate_qr(order.id)

    # ✅ save QR into DB
    order.qr_code = qr_path

    commit_repo(db)

    refresh_repo(db, order)

    items = get_order_items_repo(db,order.id)

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

    orders = get_my_orders_repo(db, current_user.id)

    result = []

    for order in orders:

        items = get_order_items_repo(db,order.id)

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

    orders = get_all_orders_repo(db)

    result = []

    for order in orders:

        items = get_order_items_repo(db,order.id)

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

    total_orders = get_total_orders_repo(db)

    total_sales = get_total_sales_repo(db)

    return {
        "total_orders": total_orders,
        "total_sales": total_sales,
    }


def update_order_status_service(
    order_id: int,
    status: str,
    db: Session,
):

    order = get_order_by_id_repo(db, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status

    commit_repo(db)

    return {"message": "Order status updated"}
