from sqlalchemy.orm import Session

from app.db.models import TodayMenu, Menu


# ✅ DELETE TODAY MENU BY DATE
def delete_today_menu_by_date_repo(db: Session, today):

    db.query(TodayMenu).filter(TodayMenu.date == today).delete()


# ✅ ADD TODAY MENU
def add_today_menu_repo(db: Session, menu_id: int, today):

    item = TodayMenu(menu_id=menu_id, date=today)

    db.add(item)


# ✅ COMMIT
def commit_repo(db: Session):

    db.commit()


# ✅ GET TODAY MENU BY ID
def get_today_menu_by_id_repo(db: Session, id: int):

    return db.query(TodayMenu).filter(TodayMenu.id == id).first()


# ✅ DELETE TODAY MENU ITEM
def delete_today_menu_repo(db: Session, item):

    db.delete(item)

    db.commit()


# ✅ GET TODAY MENU
def get_today_menu_repo(db: Session, today):

    return (
        db.query(TodayMenu, Menu)
        .join(Menu, TodayMenu.menu_id == Menu.id)
        .filter(TodayMenu.date == today)
        .all()
    )


# ✅ GET MENU BY DATE
def get_menu_by_date_repo(db: Session, selected_date):

    return (
        db.query(TodayMenu, Menu)
        .join(Menu, TodayMenu.menu_id == Menu.id)
        .filter(TodayMenu.date == selected_date)
        .all()
    )
