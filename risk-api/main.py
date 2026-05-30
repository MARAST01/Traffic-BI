"""
Microservicio de predicción de riesgo de accidentes.
Carga modelo_riesgo.pkl una sola vez al arrancar y sirve predicciones
en < 50ms gracias a que todo queda en memoria.
"""

from contextlib import asynccontextmanager
from typing import Optional
import time

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Modelo global (cargado una sola vez) ─────────────────────────────────────
_artifact: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga el modelo al arrancar; lo libera al apagar."""
    print("Cargando modelo_riesgo.pkl…")
    try:
        _artifact.update(joblib.load("/app/modelo_riesgo.pkl"))
        print(f"✔  Modelo cargado | features: {_artifact['features']}")
    except FileNotFoundError:
        print("⚠️  modelo_riesgo.pkl no encontrado — colócalo en la raíz del proyecto")
    yield
    _artifact.clear()


app = FastAPI(
    title="Risk Prediction API",
    description="Microservicio de predicción de riesgo de accidentes de tráfico",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ajustar en producción al origen del backend NestJS
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    hour:           int   = Field(..., ge=0, le=23,  description="Hora del día (0-23)")
    month:          int   = Field(..., ge=1, le=12,  description="Mes (1-12)")
    day_of_week:    int   = Field(..., ge=0, le=6,   description="Día de semana (0=Lun, 6=Dom)")
    weather_type:   str   = Field(...,               description="Tipo de clima: clear, rain, snow, fog, wind")
    intensity:      str   = Field(...,               description="Intensidad: light, normal, heavy")
    sunrise_sunset: str   = Field(...,               description="Momento del día: day, night")
    is_windy:       bool  = Field(False)
    humidity_pct:   float = Field(..., ge=0, le=100, description="Humedad relativa (%)")
    visibility_mi:  float = Field(..., ge=0,         description="Visibilidad en millas")
    temperature_c:  float = Field(...,               description="Temperatura en °C")
    traffic_signal: bool  = Field(False)
    junction:       bool  = Field(False)
    crossing:       bool  = Field(False)


class PredictResponse(BaseModel):
    risk_probability: float = Field(..., description="Probabilidad de riesgo alto (0.0 - 1.0)")
    risk_level:       str   = Field(..., description="'high' si prob >= threshold, 'low' si no")
    risk_pct:         float = Field(..., description="Porcentaje de riesgo (0-100)")
    threshold:        float = Field(..., description="Umbral de decisión usado")
    latency_ms:       float = Field(..., description="Tiempo de inferencia en milisegundos")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": bool(_artifact),
        "features": _artifact.get("features", []),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if not _artifact:
        raise HTTPException(status_code=503, detail="Modelo no disponible")

    enc      = _artifact["encoders"]
    features = _artifact["features"]
    model    = _artifact["model"]
    threshold = _artifact.get("threshold", 0.5)

    # Encodear categóricas con los mismos LabelEncoders del entrenamiento
    def safe_encode(encoder, value: str) -> int:
        classes = list(encoder.classes_)
        if value in classes:
            return int(encoder.transform([value])[0])
        # Valor desconocido → clase más frecuente (índice 0)
        return 0

    row = {
        "hour":           payload.hour,
        "month":          payload.month,
        "day_of_week":    payload.day_of_week,
        "weather_type":   safe_encode(enc["weather_type"],   payload.weather_type),
        "intensity":      safe_encode(enc["intensity"],       payload.intensity),
        "sunrise_sunset": safe_encode(enc["sunrise_sunset"],  payload.sunrise_sunset),
        "is_windy":       int(payload.is_windy),
        "humidity_pct":   payload.humidity_pct,
        "visibility_mi":  payload.visibility_mi,
        "temperature_c":  payload.temperature_c,
        "traffic_signal": int(payload.traffic_signal),
        "junction":       int(payload.junction),
        "crossing":       int(payload.crossing),
    }

    X = pd.DataFrame([row])[features]

    t0 = time.perf_counter()
    proba = float(model.predict_proba(X)[0, 1])
    latency_ms = (time.perf_counter() - t0) * 1000

    return PredictResponse(
        risk_probability=round(proba, 4),
        risk_level="high" if proba >= threshold else "low",
        risk_pct=round(proba * 100, 2),
        threshold=threshold,
        latency_ms=round(latency_ms, 3),
    )
