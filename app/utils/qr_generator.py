import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL")


def generate_qr(order_id: int):

    return f"{BASE_URL}/api/public/order/{order_id}"
