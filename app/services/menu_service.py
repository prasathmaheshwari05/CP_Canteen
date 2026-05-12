from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.models import Menu
from app.schemas.menu_schema import MenuCreate, MenuUpdate


# ✅ ADD MENU
def add_menu_service(menu: MenuCreate, db: Session):

    new_item = Menu(**menu.dict())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


# ✅ UPDATE MENU
def update_menu_service(menu_id: int, menu: MenuUpdate, db: Session):

    item = db.query(Menu).filter(Menu.id == menu_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    # ✅ update only provided fields
    for key, value in menu.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


# ✅ DELETE MENU
def delete_menu_service(menu_id: int, db: Session):

    item = db.query(Menu).filter(Menu.id == menu_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")

    db.delete(item)
    db.commit()

    return {"message": "Menu deleted"}


# ✅ GET MENU
def get_menu_service(db: Session, current_user):

    # admin → all menu
    if current_user.role == "admin":
        return db.query(Menu).all()

    # user → only available items
    return db.query(Menu).filter(Menu.available == True).all()
