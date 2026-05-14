from sqlalchemy.orm import Session

from app.db.models import Menu


# ✅ CREATE MENU
def create_menu_repo(db: Session, menu_data):

    new_item = Menu(**menu_data.dict())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


# ✅ GET MENU BY ID
def get_menu_by_id_repo(db: Session, menu_id: int):

    return db.query(Menu).filter(Menu.id == menu_id).first()


# ✅ GET ALL MENU
def get_all_menu_repo(db: Session):

    return db.query(Menu).all()


# ✅ GET AVAILABLE MENU
def get_available_menu_repo(db: Session):

    return db.query(Menu).filter(Menu.available == True).all()


# ✅ DELETE MENU
def delete_menu_repo(db: Session, item):

    db.delete(item)
    db.commit()


# ✅ UPDATE MENU
def update_menu_repo(db: Session, item, update_data):

    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item
