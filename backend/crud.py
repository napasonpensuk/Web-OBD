from sqlalchemy.orm import Session
from . import models, schemas

def get_vehicles(db: Session):
    return [v[0] for v in db.query(models.EngineMetrics.vehicle).distinct().order_by(models.EngineMetrics.vehicle).all()]

def get_metrics_by_vehicle(db: Session, vehicle: str):
    return db.query(models.EngineMetrics).filter(models.EngineMetrics.vehicle == vehicle).order_by(models.EngineMetrics.date, models.EngineMetrics.time).all()

def add_metrics_bulk(db: Session, data: list[schemas.EngineMetricsCreate]):
    objs = [models.EngineMetrics(**d.dict()) for d in data]
    db.add_all(objs)
    db.commit()
    return len(objs)
