from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.menu_schema import MenuCreate, MenuUpdate

from app.repositories.menu_repository import (
    create_menu_repo,
    get_menu_by_id_repo,
    get_all_menu_repo,
    get_available_menu_repo,
    delete_menu_repo,
    update_menu_repo,
)


# ✅ ADD MENU
def add_menu_service(menu: MenuCreate, db: Session):

    return create_menu_repo(db, menu)


# ✅ UPDATE MENU
def update_menu_service(menu_id: int, menu: MenuUpdate, db: Session):

    item = get_menu_by_id_repo(db, menu_id)

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    return update_menu_repo(db, item, menu)


# ✅ DELETE MENU
def delete_menu_service(menu_id: int, db: Session):

    item = get_menu_by_id_repo(db, menu_id)

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    delete_menu_repo(db, item)

    return {"message": "Menu deleted"}


# ✅ GET MENU
def get_menu_service(db: Session, current_user):

    # admin → all menu
    if current_user.role == "admin":
        return get_all_menu_repo(db)

    # user → only available menu
    return get_available_menu_repo(db)
