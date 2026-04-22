from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Menu
from app.db.dependency import get_db
from app.schemas.menu_schema import MenuCreate, MenuUpdate
from app.auth.dependencies import admin_required, user_required
from app.auth.dependencies import get_current_user
from app.schemas.menu_schema import MenuResponse
from typing import List

router = APIRouter()


# 👨‍💼 ADMIN → ADD MENU
@router.post("/menu", response_model=MenuResponse)
def add_menu(
    menu: MenuCreate, db: Session = Depends(get_db), user=Depends(admin_required)
):

    new_item = Menu(**menu.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # return {"message": "Menu item added"}
    return new_item


@router.put("/menu/{menu_id}", response_model=MenuResponse)
def update_menu(
    menu_id: int,
    menu: MenuUpdate,
    db: Session = Depends(get_db),
    user=Depends(admin_required),
):
    item = db.query(Menu).filter(Menu.id == menu_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    # 🔥 update only provided fields
    for key, value in menu.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)  # ✅ IMPORTANT

    return item  # ✅ return updated object


# 👨‍💼 ADMIN → DELETE MENU
@router.delete("/menu/{menu_id}")
def delete_menu(
    menu_id: int, db: Session = Depends(get_db), user=Depends(admin_required)
):

    item = db.query(Menu).filter(Menu.id == menu_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    db.delete(item)
    db.commit()

    return {"message": "Menu deleted"}


@router.get("/menu", response_model=List[MenuResponse])
def get_menu(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Menu).all()  # 👨‍💼 admin → all items
    else:
        return db.query(Menu).filter(Menu.available == True).all()  # 👨‍🍳 user
