from fastapi import FastAPI
from app.db.session import engine, Base
from app.routes import (
    test_routes,
    menu_routes,
    payment_routes,
    order_routes,
    today_menu_routes,
    auth_routes,
    role_routes,
    user_routes,
    status_routes,
)
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.limiter import limiter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

os.makedirs("qrcodes", exist_ok=True)
load_dotenv()
app = FastAPI()

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)


app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(role_routes.router, prefix="/auth", tags=["Roles"])
app.include_router(user_routes.router, prefix="/auth", tags=["Users"])
app.include_router(test_routes.router, prefix="/test", tags=["Test"])
app.include_router(menu_routes.router, prefix="/api", tags=["Menu"])
app.include_router(payment_routes.router, prefix="/payment", tags=["Payment"])
app.include_router(order_routes.router, prefix="/api", tags=["Order"])
app.include_router(today_menu_routes.router, prefix="/api", tags=["Today Menu"])
app.mount("/qrcodes", StaticFiles(directory="qrcodes"), name="qrcodes")
app.include_router(status_routes.router, prefix="/api", tags=["Status"])


@app.get("/")
def home():
    return {"message": "Canteen Backend Running"}
