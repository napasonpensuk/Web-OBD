from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import models, schemas

def get_vehicles(db: Session):
    return [v[0] for v in db.query(models.EngineMetrics.vehicle).distinct().order_by(models.EngineMetrics.vehicle).all()]

def get_metrics_by_vehicle(db: Session, vehicle: str, mode: str = "Day", date: str = None):
    query = db.query(models.EngineMetrics).filter(models.EngineMetrics.vehicle == vehicle)
    
    if date:
        current_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        if mode == "Day":
            query = query.filter(models.EngineMetrics.date == current_date)
        elif mode == "Month":
            # Get the first and last day of the month
            first_day = current_date.replace(day=1)
            if first_day.month == 12:
                last_day = first_day.replace(year=first_day.year + 1, month=1) - timedelta(days=1)
            else:
                last_day = first_day.replace(month=first_day.month + 1) - timedelta(days=1)
            query = query.filter(
                models.EngineMetrics.date >= first_day,
                models.EngineMetrics.date <= last_day
            )
        elif mode == "Year":
            # Get data for the entire year
            year_start = current_date.replace(month=1, day=1)
            year_end = current_date.replace(month=12, day=31)
            query = query.filter(
                models.EngineMetrics.date >= year_start,
                models.EngineMetrics.date <= year_end
            )
    
    return query.order_by(models.EngineMetrics.date, models.EngineMetrics.time).all()


def get_aggregated_metrics_by_vehicle(db: Session, vehicle: str, mode: str = "Day", date: str = None):
    """
    Return aggregated averages for fuel consumption grouped by hour/day/month depending on mode.
    Returns list of dicts: { 'period': str, 'avg_fuel': float }
    """
    # build filter conditions explicitly (avoid using private attributes)
    conditions = [models.EngineMetrics.vehicle == vehicle]

    if date:
        current_date = datetime.strptime(date, "%Y-%m-%d").date()
        if mode == "Day":
            conditions.append(models.EngineMetrics.date == current_date)
        elif mode == "Month":
            first_day = current_date.replace(day=1)
            if first_day.month == 12:
                last_day = first_day.replace(year=first_day.year + 1, month=1) - timedelta(days=1)
            else:
                last_day = first_day.replace(month=first_day.month + 1) - timedelta(days=1)
            conditions.append(models.EngineMetrics.date >= first_day)
            conditions.append(models.EngineMetrics.date <= last_day)
        elif mode == "Year":
            year_start = current_date.replace(month=1, day=1)
            year_end = current_date.replace(month=12, day=31)
            conditions.append(models.EngineMetrics.date >= year_start)
            conditions.append(models.EngineMetrics.date <= year_end)

    # Build aggregation query based on mode
    if mode == "Day":
        # group by hour (assumes time stored as 'HH:MM:SS' or 'HH:MM')
        period_col = func.substr(models.EngineMetrics.time, 1, 2)
    elif mode == "Month":
        period_col = func.to_char(models.EngineMetrics.date, 'YYYY-MM-DD')
    else:
        period_col = func.to_char(models.EngineMetrics.date, 'YYYY-MM')

    q = db.query(period_col.label("period"), func.avg(models.EngineMetrics.fuel_l_per_100km).label("avg_fuel")).filter(*conditions)
    q = q.group_by(period_col).order_by(period_col)

    rows = q.all()
    result = [{"period": r[0], "avg_fuel": float(r[1] or 0)} for r in rows]
    return result

def add_metrics_bulk(db: Session, data: list[schemas.EngineMetricsCreate]):
    objs = [models.EngineMetrics(**d.dict()) for d in data]
    db.add_all(objs)
    db.commit()
    return len(objs)
