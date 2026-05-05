from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.dependency import get_db
from app.db.models import User
from app.auth.jwt_handler import SECRET_KEY, ALGORITHM
from app.core.roles import ADMIN, USER, SUPERADMIN

# from app.auth.dependencies import get_current_user

# security = HTTPBearer()
security = HTTPBearer(auto_error=False)
DEBUG_MODE = False

# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db),
# ):
#     token = credentials.credentials

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

#         emp_id = payload.get("sub")  # ✅ we stored emp_id in token

#         if emp_id is None:
#             raise HTTPException(status_code=401, detail="Invalid token")

#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     # 🔥 FIX HERE (use emp_id instead of username)
#     user = db.query(User).filter(User.emp_id == int(emp_id)).first()

#     if user is None:
#         raise HTTPException(status_code=401, detail="User not found")

#     return user


# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db),
# ):
#     # 🔥 TEMP BYPASS
#     if DEBUG_MODE:

#         class FakeUser:
#             emp_id = 1
#             role = "superadmin"  # full access

#         return FakeUser()

#     # ✅ ORIGINAL CODE (keep it)
#     token = credentials.credentials

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

#         emp_id = payload.get("sub")

#         if emp_id is None:
#             raise HTTPException(status_code=401, detail="Invalid token")

#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     user = db.query(User).filter(User.emp_id == int(emp_id)).first()

#     if user is None:
#         raise HTTPException(status_code=401, detail="User not found")

#     return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if DEBUG_MODE:

        class FakeUser:
            emp_id = 1
            role = SUPERADMIN

        return FakeUser()

    if credentials is None:
        raise HTTPException(status_code=401, detail="Token missing")

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        emp_id = payload.get("sub")

        if emp_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        emp_id = int(emp_id)

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.emp_id == emp_id).first()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # ✅ ADD THIS CHECK (VERY IMPORTANT)
    if user.active_token != token:
        raise HTTPException(status_code=401, detail="Session expired")

    return user


# # 👨‍💼 Admin Only
# def admin_required(current_user=Depends(get_current_user)):
#     if current_user.role not in ["admin", "superadmin"]:
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return current_user


# # 👨‍🍳 User Only
# def user_required(current_user=Depends(get_current_user)):
#     if current_user.role not in ["user", "admin", "superadmin"]:
#         raise HTTPException(status_code=403, detail="User access required")
#     return current_user


# def superadmin_required(current_user=Depends(get_current_user)):
#     if current_user.role != "superadmin":
#         raise HTTPException(status_code=403, detail="Superadmin only")
#     return current_user
def role_required(allowed_roles: list):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user

    return role_checker


admin_required = role_required([ADMIN, SUPERADMIN])
user_required = role_required([USER, ADMIN, SUPERADMIN])
superadmin_required = role_required([SUPERADMIN])


# def admin_required(current_user: User = Depends(get_current_user)):
#     if current_user.role != "admin":
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return current_user


def admin_or_superadmin_required(current_user=Depends(get_current_user)):
    if current_user.role not in [ADMIN, SUPERADMIN]:
        raise HTTPException(
            status_code=403, detail="Admin or Superadmin access required"
        )
    return current_user
