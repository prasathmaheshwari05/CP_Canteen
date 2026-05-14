from fastapi import HTTPException
from sqlalchemy.orm import Session

from datetime import date

from app.schemas.today_menu_schema import TodayMenuCreate, TodayMenuUpdate

from app.repositories.today_menu_repository import (
    delete_today_menu_by_date_repo,
    add_today_menu_repo,
    commit_repo,
    get_today_menu_by_id_repo,
    delete_today_menu_repo,
    get_today_menu_repo,
    get_menu_by_date_repo,
)


# ✅ ADD TODAY MENU
def add_today_menu_service(
    request: TodayMenuCreate,
    db: Session,
):

    today = date.today()

    # ✅ delete today's old menu
    delete_today_menu_by_date_repo(db, today)

    # ✅ add new menu
    for menu_id in request.menu_ids:

        add_today_menu_repo(db, menu_id, today)

    commit_repo(db)

    return {"message": "Today's menu set successfully"}


# ✅ DELETE TODAY MENU
def delete_today_menu_service(
    id: int,
    db: Session,
):

    item = get_today_menu_by_id_repo(db, id)

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    delete_today_menu_repo(db, item)

    return {"message": "Deleted"}


# ✅ GET TODAY MENU
def get_today_menu_service(
    db: Session,
):

    today = date.today()

    items = get_today_menu_repo(db, today)

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

    item = get_today_menu_by_id_repo(db, id)

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    item.menu_id = request.menu_id

    commit_repo(db)

    return {"message": "Updated"}


# ✅ GET PUBLISHED MENU BY DATE
def get_menu_by_date_service(
    selected_date: date,
    db: Session,
):

    items = get_menu_by_date_repo(db, selected_date)

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
