# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base

#

# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"ssl": {"ca": "C:/Users/prasath.sundararajan/Downloads/ca.pem"}},
#     echo=True,
# )

# SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Base = declarative_base()


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()
