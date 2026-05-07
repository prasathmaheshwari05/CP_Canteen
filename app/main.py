from fastapi import FastAPI
from app.db.session import engine, Base
from fastapi import Depends
from app.auth.dependencies import get_current_user
from app.routes import auth_routes
from app.routes import test_routes
from app.routes import menu_routes
from app.routes import payment_routes
from app.routes import order_routes
from app.routes import today_menu_routes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routes import auth_routes, role_routes, user_routes
from app.routes import status_routes

os.makedirs("qrcodes", exist_ok=True)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=[
    #     "http://localhost:8080",
    #     "http://127.0.0.1:8080",
    #     "http://localhost:5500",
    #     "http://172.17.7.211:8080",
    # ],
    allow_origins=[
        "https://cp-dining.onrender.com",
        "http://localhost:8080",
        "http://172.17.7.211:8080",
        "http://172.29.96.1:8080",
    ],
    # allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 🔥 Create tables first
Base.metadata.create_all(bind=engine)

# 🔌 Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
# ✅ Roles
app.include_router(role_routes.router, prefix="/auth", tags=["Roles"])
# ✅ Users
app.include_router(user_routes.router, prefix="/auth", tags=["Users"])
app.include_router(test_routes.router, prefix="/test", tags=["Test"])
app.include_router(menu_routes.router, prefix="/api", tags=["Menu"])
app.include_router(payment_routes.router, prefix="/payment", tags=["Payment"])
app.include_router(order_routes.router, prefix="/api", tags=["Order"])
app.include_router(today_menu_routes.router, prefix="/api", tags=["Today Menu"])
# app.include_router(auth_routes.router, dependencies=[Depends(get_current_user)])
app.mount("/qrcodes", StaticFiles(directory="qrcodes"), name="qrcodes")
app.include_router(status_routes.router, prefix="/api", tags=["Status"])


@app.get("/")
def home():
    return {"message": "Canteen Backend Running"}
