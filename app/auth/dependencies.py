from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.dependency import get_db
from app.db.models import User
from app.auth.jwt_handler import SECRET_KEY, ALGORITHM
from app.core.roles import ADMIN, USER, SUPERADMIN

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
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

    if user.active_token != token:
        raise HTTPException(status_code=401, detail="Session expired")

    return user


def role_required(allowed_roles: list):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user

    return role_checker


admin_required = role_required([ADMIN, SUPERADMIN])
user_required = role_required([USER, ADMIN, SUPERADMIN])
superadmin_required = role_required([SUPERADMIN])


def admin_or_superadmin_required(current_user=Depends(get_current_user)):
    if current_user.role not in [ADMIN, SUPERADMIN]:
        raise HTTPException(
            status_code=403, detail="Admin or Superadmin access required"
        )
    return current_user
