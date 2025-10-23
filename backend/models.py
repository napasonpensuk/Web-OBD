from sqlalchemy import Column, Integer, String, Float, BigInteger, Date
from .db import Base

class EngineMetrics(Base):
    __tablename__ = "engine_metrics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    vehicle = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    rpm = Column(Integer)
    speed = Column(Integer)
    tps_app = Column(Float)
    brake = Column(Float)
    steering = Column(Float)
    coolant_temp_c = Column(Integer)
    fuel_l_per_100km = Column(Float)
    running_hour = Column(Float)
    odo_km = Column(BigInteger)
