FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias primero (capa cacheada)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código y modelo
COPY main.py .
COPY modelo_riesgo.pkl .

EXPOSE 8000

# Un worker es suficiente: el modelo está en memoria y RandomForest ya usa n_jobs=-1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
