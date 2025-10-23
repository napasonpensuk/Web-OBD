from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os, time
from sqlalchemy.exc import OperationalError

DB_USER = os.getenv("DATABASE_USER", "obduser")
DB_PASS = os.getenv("DATABASE_PASSWORD", "obdpass")
DB_HOST = os.getenv("DATABASE_HOST", "db")
DB_PORT = os.getenv("DATABASE_PORT", "5432")
DB_NAME = os.getenv("DATABASE_NAME", "obd_dataview")

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

Base = declarative_base()

# ✅ ฟังก์ชัน retry เพื่อรอให้ DB พร้อมก่อนเชื่อมต่อ
def get_engine_with_retry(max_retries=10, delay=3):
    for attempt in range(max_retries):
        try:
            engine = create_engine(SQLALCHEMY_DATABASE_URL)
            with engine.connect():
                print("✅ Database connected")
            return engine
        except OperationalError:
            print(f"❌ DB not ready, retrying ({attempt+1}/{max_retries})...")
            time.sleep(delay)
    raise RuntimeError("Database not reachable after retries")

engine = get_engine_with_retry()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ ฟังก์ชันนี้ต้องมี (FastAPI ใช้ใน Depends)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
