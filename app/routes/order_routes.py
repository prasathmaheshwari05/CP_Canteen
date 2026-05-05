from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependency import get_db
from app.auth.dependencies import get_current_user
from app.db.models import Order, OrderItem, Menu, User
from app.schemas.order_schema import OrderCreate
from typing import List
from app.schemas.order_schema import OrderResponse, OrderPut
from app.auth.dependencies import admin_required
from datetime import date
from datetime import datetime

router = APIRouter()  # 🔥 THIS WAS MISSING


@router.post("/order", response_model=OrderResponse)
def create_order(
    request: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.items:
        raise HTTPException(status_code=400, detail="No items selected")
    today = date.today()

    # ✅ Step 1: get categories from request
    requested_categories = set()

    for item in request.items:
        menu = db.query(Menu).filter(Menu.id == item.menu_id).first()
        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu ID {item.menu_id} not found"
            )
        requested_categories.add(menu.category)

    # ✅ Step 2: get today's orders for this user
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    existing_orders = (
        db.query(Order)
        .filter(
            Order.user_id == current_user.id,
            Order.created_at >= start,
            Order.created_at <= end,
        )
        .all()
    )

    # ✅ Step 3: check conflict
    for order in existing_orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

        for item in items:
            menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

            if menu and menu.category in requested_categories:
                raise HTTPException(
                    status_code=400,
                    detail=f"You already ordered {menu.category} today",
                )

    total_amount = 0

    new_order = Order(user_id=current_user.id, status="pending")
    # new_order = Order(user_id=current_user.emp_id, status="pending")
    # new_order = Order(user_id=1, status="pending")
    db.add(new_order)
    db.flush()

    for item in request.items:
        menu = db.query(Menu).filter(Menu.id == item.menu_id).first()

        if not menu:
            raise HTTPException(
                status_code=404, detail=f"Menu ID {item.menu_id} not found"
            )

        if not menu.available:
            raise HTTPException(status_code=400, detail=f"{menu.name} not available")

        print("DEBUG MENU:", menu.id, menu.price)

        total_amount += menu.price * item.quantity

        order_item = OrderItem(
            order_id=new_order.id, menu_id=item.menu_id, quantity=item.quantity
        )

        db.add(order_item)

    new_order.total_amount = total_amount
    db.commit()
    qr_path = generate_qr(new_order.id)
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


@router.put("/order/{order_id}")
def replace_order(
    order_id: int,
    request: OrderPut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order cannot be modified")
    # 🔥 delete old items
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

    total_amount = 0

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

    db.commit()

    # ✅ 🔥 REGENERATE QR CODE
    qr_path = generate_qr(order.id)

    db.refresh(order)

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": items,
        "qr_code": qr_path,  # ✅ return new QR
    }


# @router.get("/orders", response_model=List[OrderResponse])
# def get_orders(db: Session = Depends(get_db)):
#     orders = db.query(Order).all()

#     result = []
#     for order in orders:
#         items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

#         order_dict = {
#             "id": order.id,
#             "user_id": order.user_id,
#             "total_amount": order.total_amount,
#             "created_at": order.created_at,
#             "status": order.status,
#             "items": items,
#         }

#         result.append(order_dict)

#     return result


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)  # or emp_id (based on your fix)
        .all()
    )

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
                "qr_code": f"qrcodes/order_{order.id}.png",
            }
        )

    return result


@router.get("/admin/orders", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
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
                "qr_code": f"qrcodes/order_{order.id}.png",
            }
        )

    return result


from sqlalchemy import func


@router.get("/admin/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    total_orders = db.query(Order).count()
    total_sales = db.query(func.sum(Order.total_amount)).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_sales": total_sales,
    }


@router.put("/admin/order/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    db.commit()

    return {"message": "Order status updated"}


import qrcode
import os


def generate_qr(order_id: int):
    data = (
        f"https://genetics-granite-champion.ngrok-free.dev/api/public/order/{order_id}"
    )

    os.makedirs("qrcodes", exist_ok=True)
    file_path = f"qrcodes/order_{order_id}.png"

    img = qrcode.make(data)
    img.save(file_path)

    return file_path


@router.get("/public/order/{order_id}")
def public_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Invalid QR")

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    return {
        "order_id": order.id,
        "status": order.status,
        "items": [
            {"menu_id": item.menu_id, "quantity": item.quantity} for item in items
        ],
    }


# @router.get("/public/order/{order_id}")
# def public_order(order_id: int, db: Session = Depends(get_db)):
#     order = db.query(Order).filter(Order.id == order_id).first()

#     if not order:
#         raise HTTPException(status_code=404, detail="Invalid QR")

#     items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

#     return {"order_id": order.id, "status": order.status, "items": items}


@router.get("/admin/scan/{order_id}")
def scan_qr(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Invalid QR")

    return {"order_id": order.id, "status": order.status, "message": "Valid order"}
