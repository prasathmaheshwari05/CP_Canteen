from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from typing import List

from app.db.dependency import get_db

from app.auth.dependencies import get_current_user, admin_required

from app.db.models import Order, OrderItem, Menu, User

from app.schemas.order_schema import OrderCreate, OrderResponse, OrderPut

from app.services.order_service import (
    create_order_service,
    replace_order_service,
    get_my_orders_service,
    get_all_orders_service,
    admin_dashboard_service,
    update_order_status_service,
)

router = APIRouter()


@router.post("/order", response_model=OrderResponse)
def create_order(
    request: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return create_order_service(request, db, current_user)


@router.put("/order/{order_id}")
def replace_order(
    order_id: int,
    request: OrderPut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return replace_order_service(order_id, request, db, current_user)


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_my_orders_service(db, current_user)


@router.get("/admin/orders", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):

    return get_all_orders_service(db)


@router.get("/admin/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):

    return admin_dashboard_service(db)


@router.put("/admin/order/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):

    return update_order_status_service(order_id, status, db)


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
