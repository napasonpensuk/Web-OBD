FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV DATABASE_HOST=db
ENV DATABASE_PORT=5432
ENV DATABASE_USER=obduser
ENV DATABASE_PASSWORD=obdpass
ENV DATABASE_NAME=obd_dataview

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
