from fastapi import HTTPException
from sqlalchemy.orm import Session

from datetime import date

from app.db.models import TodayMenu, Menu

from app.schemas.today_menu_schema import TodayMenuCreate, TodayMenuUpdate


# ✅ ADD TODAY MENU
def add_today_menu_service(
    request: TodayMenuCreate,
    db: Session,
):

    today = date.today()

    # ✅ delete today's old menu
    db.query(TodayMenu).filter(TodayMenu.date == today).delete()

    # ✅ add new menu
    for menu_id in request.menu_ids:

        item = TodayMenu(menu_id=menu_id, date=today)

        db.add(item)

    db.commit()

    return {"message": "Today's menu set successfully"}


# ✅ DELETE TODAY MENU
def delete_today_menu_service(
    id: int,
    db: Session,
):

    item = db.query(TodayMenu).filter(TodayMenu.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(item)

    db.commit()

    return {"message": "Deleted"}


# ✅ GET TODAY MENU
def get_today_menu_service(
    db: Session,
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
                "today_menu_id": today_item.id,
                "menu_id": menu.id,
                "name": menu.name,
                "price": menu.price,
                "available": menu.available,
                "images": menu.images,
            }
        )

    return result


# ✅ UPDATE TODAY MENU
def update_today_menu_service(
    id: int,
    request: TodayMenuUpdate,
    db: Session,
):

    item = db.query(TodayMenu).filter(TodayMenu.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    item.menu_id = request.menu_id

    db.commit()

    return {"message": "Updated"}


# ✅ GET PUBLISHED MENU BY DATE
def get_menu_by_date_service(
    selected_date: date,
    db: Session,
):

    items = (
        db.query(TodayMenu, Menu)
        .join(Menu, TodayMenu.menu_id == Menu.id)
        .filter(TodayMenu.date == selected_date)
        .all()
    )

    result = []

    for today_item, menu in items:

        result.append(
            {
                "today_menu_id": today_item.id,
                "menu_id": menu.id,
                "name": menu.name,
                "price": menu.price,
                "category": menu.category,
                "available": menu.available,
                "images": menu.images,
                "date": today_item.date,
            }
        )

    return result
