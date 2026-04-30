from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.db.dependency import get_db
from app.db.models import TodayMenu, Menu
from app.schemas.today_menu_schema import TodayMenuCreate
from app.auth.dependencies import admin_required, get_current_user
from app.schemas.today_menu_schema import TodayMenuUpdate
from app.auth.dependencies import admin_or_superadmin_required, get_current_user

router = APIRouter()


@router.post("/today-menu")
def add_today_menu(
    request: TodayMenuCreate,
    db: Session = Depends(get_db),
    user = Depends(admin_or_superadmin_required)
):
    today = date.today()

    # delete today's items
    db.query(TodayMenu).filter(TodayMenu.date == today).delete()

    for menu_id in request.menu_ids:
        item = TodayMenu(menu_id=menu_id, date=today)
        db.add(item)

    db.commit()

    return {"message": "Today's menu set successfully"}


@router.delete("/today-menu/{id}")
def delete_today_menu(
    id: int,
    db: Session = Depends(get_db),
    user = Depends(admin_or_superadmin_required)
):
    item = db.query(TodayMenu).filter(TodayMenu.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(item)
    db.commit()

    return {"message": "Deleted"}


# @router.put("/today-menu/{id}")
# def update_today_menu(
#     id: int,
#     request: TodayMenuCreate,
#     db: Session = Depends(get_db),
#     user=Depends(admin_required),
# ):
#     item = db.query(TodayMenu).filter(TodayMenu.id == id).first()

#     if not item:
#         raise HTTPException(status_code=404, detail="Not found")

#     item.menu_id = request.menu_id
#     db.commit()

#     return {"message": "Updated"}


@router.get("/today-menu")
def get_today_menu(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()

    items = (
        db.query(TodayMenu, Menu)
        .join(Menu, TodayMenu.menu_id == Menu.id)
        .filter(TodayMenu.date == today)
        .all()
    )

    result = []
    for today_item, menu in items:
        result.append(
            {
                "today_menu_id": today_item.id,  # ✅ clear naming
                "menu_id": menu.id,  # ✅ ADD THIS
                "name": menu.name,
                "price": menu.price,
                "available": menu.available,
                "images": menu.images,
            }
        )

    return result


@router.put("/today-menu/{id}")
def update_today_menu(
    id: int,
    request: TodayMenuUpdate,
    db: Session = Depends(get_db),
    user = Depends(admin_or_superadmin_required)
):
    item = db.query(TodayMenu).filter(TodayMenu.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    item.menu_id = request.menu_id
    db.commit()

    return {"message": "Updated"}
