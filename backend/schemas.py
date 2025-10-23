from pydantic import BaseModel
from datetime import date

class EngineMetricsBase(BaseModel):
    vehicle: str
    date: date
    time: str
    rpm: int | None = None
    speed: int | None = None
    tps_app: float | None = None
    brake: float | None = None
    steering: float | None = None
    coolant_temp_c: int | None = None
    fuel_l_per_100km: float | None = None
    running_hour: float | None = None
    odo_km: int | None = None

class EngineMetricsCreate(EngineMetricsBase):
    pass

class EngineMetricsOut(EngineMetricsBase):
    id: int
    class Config:
        from_attributes = True