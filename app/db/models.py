from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date
from app.db.session import Base
from datetime import date
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy import Column, DateTime
from datetime import datetime
from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")


# 👤 USER TABLE
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(Integer, unique=True, index=True)
    emp_name = Column(String(100))
    emp_mail = Column(String(150), unique=True)
    password = Column(String(255))
    role = Column(String(50))
    active_token = Column(String(500), nullable=True)


# 🍽️ MENU TABLE
class Menu(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150))
    price = Column(Float)
    category = Column(String(50))
    available = Column(Boolean, default=True)
    images = Column(JSON)
    description = Column(String(500))


class TodayMenu(Base):
    __tablename__ = "today_menu"

    id = Column(Integer, primary_key=True, index=True)
    menu_id = Column(Integer, ForeignKey("menu.id"))
    date = Column(Date, default=date.today)


# 📦 ORDER TABLE
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    status = Column(String(50), default="pending")

    created_at = Column(DateTime, default=lambda: datetime.now(IST))


# 🧾 ORDER ITEMS
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_id = Column(Integer, ForeignKey("menu.id"))
    quantity = Column(Integer)


# 💰 PAYMENT TABLE
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer)
    razorpay_order_id = Column(String(150))
    razorpay_payment_id = Column(String(150))
    razorpay_signature = Column(String(255))
    status = Column(String(50))
