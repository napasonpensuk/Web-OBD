from fastapi import FastAPI, Depends, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
from io import StringIO

from . import db, models, schemas, crud

models.Base.metadata.create_all(bind=db.engine)

app = FastAPI(
    title="Driving Behavior Dashboard API",
    max_request_size=50 * 1024 * 1024  # 50MB limit
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/vehicles", response_model=list[str])
def list_vehicles(database: Session = Depends(db.get_db)):
    return crud.get_vehicles(database)

@app.get("/metrics/{vehicle}", response_model=list[schemas.EngineMetricsOut])
def read_metrics(vehicle: str, database: Session = Depends(db.get_db)):
    result = crud.get_metrics_by_vehicle(database, vehicle)
    if not result:
        raise HTTPException(status_code=404, detail="No data found")
    return result

@app.post("/upload-csv")
def upload_csv(file: UploadFile, database: Session = Depends(db.get_db)):
    try:
        content = file.file.read().decode("utf-8")
        df = pd.read_csv(StringIO(content))
        rename_map = {
            'Vehicle':'vehicle','Date':'date','Time':'time','RPM':'rpm','Speed':'speed',
            'TPS/APP':'tps_app','Brake':'brake','Steering':'steering',
            'Coolant Temp (°C)':'coolant_temp_c','Fuel Consumption (L/100km)':'fuel_l_per_100km',
            'Running Hour':'running_hour','ODO (km)':'odo_km'
        }
        df.rename(columns=rename_map, inplace=True)
        records = [schemas.EngineMetricsCreate(**row) for row in df.to_dict(orient="records")]
        inserted = crud.add_metrics_bulk(database, records)
        return {"rows_inserted": inserted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {e}")
