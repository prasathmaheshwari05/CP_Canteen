from fastapi import APIRouter, Depends
from app.auth.dependencies import admin_required, user_required

router = APIRouter()


@router.get("/admin-only")
def admin_data(user=Depends(admin_required)):
    return {"message": "Welcome Admin"}


@router.get("/user-only")
def user_data(user=Depends(user_required)):
    return {"message": "Welcome User"}
