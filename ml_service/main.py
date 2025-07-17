from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Query, Depends, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
from prophet import Prophet
import pickle
import os
import uuid
import shutil
import logging
from typing import List, Optional, Dict
from datetime import datetime
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://mlinventorymanagment-default-rtdb.firebaseio.com/'
})

# --- Logging Setup ---
logging.basicConfig(filename='ml_service.log', level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# --- Constants ---
MODEL_DIR = "models"
API_KEY = "key"  # Change this in production!

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# --- FastAPI App ---
app = FastAPI(title="Advanced Prophet ML Service",
              description="A feature-rich time series forecasting API with Prophet.",
              version="2.0.0")

# --- Authentication Dependency ---
def api_key_auth(key: str = Query(..., description="API Key for authentication")):
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

# --- Pydantic Models ---
class TrainData(BaseModel):
    data: list  # List of dicts with 'ds' and 'y'
    model_name: Optional[str] = None
    prophet_params: Optional[dict] = None
    holidays: Optional[List[dict]] = None

class PredictData(BaseModel):
    future: list  # List of future dates as strings
    model_name: Optional[str] = None

class EvalData(BaseModel):
    data: list  # List of dicts with 'ds' and 'y'
    model_name: Optional[str] = None

# --- Helper Functions ---
def get_model_path(model_name: str) -> str:
    return os.path.join(MODEL_DIR, f"{model_name}.pkl")

def save_model(model, model_name: str, meta: dict):
    path = get_model_path(model_name)
    with open(path, "wb") as f:
        pickle.dump({'model': model, 'meta': meta}, f)

def load_model(model_name: str):
    path = get_model_path(model_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")
    with open(path, "rb") as f:
        
        obj = pickle.load(f)
    return obj['model'], obj['meta']

def list_models() -> List[Dict]:
    models = []
    for fname in os.listdir(MODEL_DIR):
        if fname.endswith('.pkl'):
            path = os.path.join(MODEL_DIR, fname)
            with open(path, "rb") as f:
                obj = pickle.load(f)
                meta = obj.get('meta', {})
                meta['model_name'] = fname[:-4]
                models.append(meta)
    return models

def delete_model(model_name: str):
    path = get_model_path(model_name)
    if os.path.exists(path):
        os.remove(path)
    else:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")

def allowed_file(filename):
    return filename.endswith('.pkl')

def save_prediction_to_firebase(date, prediction):
    ref = db.reference('predictions')
    ref.push({
        'date': str(date),  # Ensure it's a string
        'prediction': prediction
    })

def get_inventory_from_firebase():
    ref = db.reference('inventory')
    return ref.get()

# --- Endpoints ---
@app.get("/health", tags=["Utility"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.get("/models", tags=["Model Management"])
def get_models(key: str = Depends(api_key_auth)):
    """List all saved models and their metadata."""
    return {"models": list_models()}

@app.delete("/model/{model_name}", tags=["Model Management"])
def remove_model(model_name: str, key: str = Depends(api_key_auth)):
    """Delete a specific model version."""
    delete_model(model_name)
    return {"message": f"Model '{model_name}' deleted."}

@app.get("/model/{model_name}/download", tags=["Model Management"])
def download_model(model_name: str, key: str = Depends(api_key_auth)):
    """Download a trained model file."""
    path = get_model_path(model_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Model not found.")
    return FileResponse(path, filename=f"{model_name}.pkl")

@app.post("/model/upload", tags=["Model Management"])
def upload_model(file: UploadFile = File(...), key: str = Depends(api_key_auth)):
    """Upload a pretrained Prophet model (.pkl)."""
    if not file.filename or not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File must be a .pkl file with a valid name.")
    model_name = file.filename[:-4]
    path = get_model_path(model_name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"message": f"Model '{model_name}' uploaded."}

@app.post("/train", tags=["Training"])
def train_model(train_data: TrainData, key: str = Depends(api_key_auth)):
    """Train a Prophet model from JSON data. Supports custom parameters and holidays."""
    df = pd.DataFrame(train_data.data)
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise HTTPException(status_code=400, detail="Data must contain 'ds' and 'y' columns")
    model_name = train_data.model_name or f"model_{uuid.uuid4().hex[:8]}"
    params = train_data.prophet_params or {}
    model = Prophet(**params)
    if train_data.holidays:
        holidays_df = pd.DataFrame(train_data.holidays)
        model.holidays = holidays_df
    model.fit(df)
    meta = {
        'trained_at': datetime.utcnow().isoformat(),
        'params': params,
        'n_rows': len(df),
        'holidays': train_data.holidays,
    }
    save_model(model, model_name, meta)
    logging.info(f"Trained model '{model_name}' with {len(df)} rows.")
    return {"message": f"Model '{model_name}' trained and saved.", "model_name": model_name}

@app.post("/train_csv", tags=["Training"])
async def train_model_csv(
    file: UploadFile = File(...),
    model_name: Optional[str] = Query(None),
    key: str = Depends(api_key_auth)
):
    """Train a Prophet model from a CSV file. CSV must have 'ds' and 'y' columns."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV with a valid name.")
    df = pd.read_csv(file.file)
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must have 'ds' and 'y' columns")
    model_name = model_name or f"model_{uuid.uuid4().hex[:8]}"
    model = Prophet()
    model.fit(df)
    meta = {
        'trained_at': datetime.utcnow().isoformat(),
        'params': {},
        'n_rows': len(df),
        'holidays': None,
    }
    save_model(model, model_name, meta)
    logging.info(f"Trained model '{model_name}' from CSV with {len(df)} rows.")
    return {"message": f"Model '{model_name}' trained and saved from CSV.", "model_name": model_name}

@app.post("/predict", tags=["Prediction"])
def predict_stockout(predict_data: PredictData, key: str = Depends(api_key_auth)):
    # Validate all future dates
    for date_str in predict_data.future:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format in 'future': {date_str}. Use YYYY-MM-DD.")
    model_name = predict_data.model_name or list_models()[0]['model_name'] if list_models() else None
    if not model_name:
        raise HTTPException(status_code=400, detail="No model available. Please train first.")
    model, meta = load_model(model_name)
    future_df = pd.DataFrame({'ds': predict_data.future})
    forecast = model.predict(future_df)
    result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')
    for item in result:
        # Convert ds to string if it's not already
        ds_str = str(item['ds'])
        save_prediction_to_firebase(ds_str, item['yhat'])
    return {"forecast": result, "model_name": model_name}

@app.post("/evaluate", tags=["Evaluation"])
def evaluate_model(eval_data: EvalData, key: str = Depends(api_key_auth)):
    """Evaluate a model's accuracy (MAE, RMSE) on provided test data."""
    model_name = eval_data.model_name or list_models()[0]['model_name'] if list_models() else None
    if not model_name:
        raise HTTPException(status_code=400, detail="No model available. Please train first.")
    model, meta = load_model(model_name)
    df = pd.DataFrame(eval_data.data)
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise HTTPException(status_code=400, detail="Data must contain 'ds' and 'y' columns")
    forecast = model.predict(df[['ds']])
    y_true = df['y'].values
    y_pred = forecast['yhat'].values
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    return {"model_name": model_name, "mae": mae, "rmse": rmse}

@app.post("/train_async", tags=["Training"])
def train_model_async(train_data: TrainData, background_tasks: BackgroundTasks, key: str = Depends(api_key_auth)):
    """Stub for async training (returns immediately, training runs in background)."""
    def train_task():
        try:
            df = pd.DataFrame(train_data.data)
            model_name = train_data.model_name or f"model_{uuid.uuid4().hex[:8]}"
            params = train_data.prophet_params or {}
            model = Prophet(**params)
            if train_data.holidays:
                holidays_df = pd.DataFrame(train_data.holidays)
                model.holidays = holidays_df
            model.fit(df)
            meta = {
                'trained_at': datetime.utcnow().isoformat(),
                'params': params,
                'n_rows': len(df),
                'holidays': train_data.holidays,
            }
            save_model(model, model_name, meta)
            logging.info(f"[ASYNC] Trained model '{model_name}' with {len(df)} rows.")
        except Exception as e:
            logging.error(f"[ASYNC] Training failed: {e}")
    background_tasks.add_task(train_task)
    return {"message": "Training started in background."} 

@app.get("/inventory")
def get_inventory():
    data = get_inventory_from_firebase()
    return {"inventory": data} 