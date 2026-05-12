from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.dependency import get_db

from app.auth.dependencies import get_current_user, admin_or_superadmin_required

from app.schemas.today_menu_schema import TodayMenuCreate, TodayMenuUpdate

from app.services.today_menu_service import (
    add_today_menu_service,
    delete_today_menu_service,
    get_today_menu_service,
    update_today_menu_service,
)

router = APIRouter()


# ✅ ADD TODAY MENU
@router.post("/today-menu")
def add_today_menu(
    request: TodayMenuCreate,
    db: Session = Depends(get_db),
    user=Depends(admin_or_superadmin_required),
):

    return add_today_menu_service(request, db)


# ✅ DELETE TODAY MENU
@router.delete("/today-menu/{id}")
def delete_today_menu(
    id: int, db: Session = Depends(get_db), user=Depends(admin_or_superadmin_required)
):

    return delete_today_menu_service(id, db)


# ✅ GET TODAY MENU
@router.get("/today-menu")
def get_today_menu(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_today_menu_service(db)


# ✅ UPDATE TODAY MENU
@router.put("/today-menu/{id}")
def update_today_menu(
    id: int,
    request: TodayMenuUpdate,
    db: Session = Depends(get_db),
    user=Depends(admin_or_superadmin_required),
):

    return update_today_menu_service(id, request, db)
