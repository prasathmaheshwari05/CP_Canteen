from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.dependency import get_db

from app.schemas.menu_schema import MenuCreate, MenuUpdate, MenuResponse

from app.auth.dependencies import admin_required, get_current_user

from app.services.menu_service import (
    add_menu_service,
    update_menu_service,
    delete_menu_service,
    get_menu_service,
)

router = APIRouter()


# ✅ ADD MENU
@router.post("/menu", response_model=MenuResponse)
def add_menu(
    menu: MenuCreate, db: Session = Depends(get_db), user=Depends(admin_required)
):
    return add_menu_service(menu, db)


# ✅ UPDATE MENU
@router.put("/menu/{menu_id}", response_model=MenuResponse)
def update_menu(
    menu_id: int,
    menu: MenuUpdate,
    db: Session = Depends(get_db),
    user=Depends(admin_required),
):
    return update_menu_service(menu_id, menu, db)


# ✅ DELETE MENU
@router.delete("/menu/{menu_id}")
def delete_menu(
    menu_id: int, db: Session = Depends(get_db), user=Depends(admin_required)
):
    return delete_menu_service(menu_id, db)


# ✅ GET MENU
@router.get("/menu", response_model=List[MenuResponse])
def get_menu(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_menu_service(db, current_user)
