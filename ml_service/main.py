from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Query, Depends, Response, Header, Body
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
from firebase_admin import credentials, db, firestore, auth as firebase_auth
from fastapi import UploadFile, File, Header, HTTPException
from firebase_admin import firestore, auth as firebase_auth
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from fastapi.middleware.cors import CORSMiddleware
import chardet
import json
from twilio.rest import Client
from dotenv import load_dotenv

cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://mlinventorymanagment-default-rtdb.firebaseio.com/'
})

# Load environment variables
load_dotenv()

# --- Logging Setup ---
logging.basicConfig(filename='ml_service.log', level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# --- Constants ---
MODEL_DIR = "models"
API_KEY = os.getenv('API_KEY', 'key')  # Get from .env or use default

# --- Twilio Setup ---
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Initialize Twilio client
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logging.info("Twilio client initialized successfully")
    except Exception as e:
        twilio_client = None
        logging.warning(f"Failed to initialize Twilio client: {e}")
else:
    twilio_client = None
    logging.warning("Twilio credentials not found in .env file. SMS functionality will be disabled.")

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# --- FastAPI App ---
app = FastAPI(title="Advanced Prophet ML Service",
              description="A feature-rich time series forecasting API with Prophet.",
              version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for all origins (not recommended for prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    ref.push(json.dumps({
        'date': str(date),  # Ensure it's a string
        'prediction': prediction
    }))

def get_inventory_from_firebase():
    ref = db.reference('inventory')
    return ref.get()

def get_inventory_from_firestore():
    db_firestore = firestore.client()
    docs = db_firestore.collection("inventory").stream()
    inventory = {}
    for doc in docs:
        inventory[doc.id] = doc.to_dict()
    return inventory

ALLOWED_ADMINS = ["abhixshek20@gmail.com", "sharveshsr9@gmail.com","aswinarun3103@gmail.com"]  # Replace with your real admin emails

# Store uploaded data in memory for demo (replace with persistent storage in production)
last_uploaded_df = None

def push_dashboard_to_firestore(data):
    db_firestore = firestore.client()
    db_firestore.collection("dashboard").document("main").set(data)

def push_sales_to_firestore(data):
    db_firestore = firestore.client()
    db_firestore.collection("sales").document("main").set(data)

def push_notifications_to_firestore(data):
    db_firestore = firestore.client()
    db_firestore.collection("notifications").document("main").set(data)

def send_sms_notification(phone_number: str, message: str):
    """Send WhatsApp notification using Twilio"""
    if not twilio_client:
        logging.error("Twilio client not initialized. Cannot send WhatsApp message.")
        return False
    
    # Format phone number for WhatsApp if not already formatted
    if not phone_number.startswith('whatsapp:'):
        phone_number = f"whatsapp:{phone_number}"
    
    try:
        message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        logging.info(f"WhatsApp message sent successfully to {phone_number}. SID: {message.sid}")
        return True
    except Exception as e:
        logging.error(f"Failed to send WhatsApp message to {phone_number}: {str(e)}")
        return False

def send_inventory_alert(phone_number: str, product_name: str, current_stock: int, threshold: int = 10):
    """Send inventory alert when stock is low"""
    message = f"🚨 INVENTORY ALERT: {product_name} stock is low! Current stock: {current_stock}, Threshold: {threshold}"
    return send_sms_notification(phone_number, message)

def send_sales_notification(phone_number: str, total_sales: float, date: str):
    """Send daily sales summary"""
    message = f"📊 DAILY SALES REPORT: Total sales for {date}: ${total_sales:.2f}"
    return send_sms_notification(phone_number, message)

def send_whatsapp_template_message(phone_number: str, template_sid: str, variables: dict):
    """Send WhatsApp message using a template"""
    if not twilio_client:
        logging.error("Twilio client not initialized. Cannot send WhatsApp template message.")
        return False
    
    # Format phone number for WhatsApp if not already formatted
    if not phone_number.startswith('whatsapp:'):
        phone_number = f"whatsapp:{phone_number}"
    
    try:
        message = twilio_client.messages.create(
            from_=TWILIO_PHONE_NUMBER,
            content_sid=template_sid,
            content_variables=json.dumps(variables),
            to=phone_number
        )
        logging.info(f"WhatsApp template message sent successfully to {phone_number}. SID: {message.sid}")
        return True
    except Exception as e:
        logging.error(f"Failed to send WhatsApp template message to {phone_number}: {str(e)}")
        return False

def send_order_notification(phone_number: str, delivery_date: str, delivery_time: str):
    """Send order notification using WhatsApp template"""
    template_sid = "HX350d429d32e64a552466cafecbe95f3c"  # Order Notifications template
    variables = {
        "1": delivery_date,
        "2": delivery_time
    }
    return send_whatsapp_template_message(phone_number, template_sid, variables)

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
    
    rawdata = file.file.read()
    result = chardet.detect(rawdata)
    encoding = result['encoding']

    import io
    df = pd.read_csv(io.BytesIO(rawdata), encoding=encoding)

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

@app.post("/api/admin-upload")
async def admin_upload(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    global last_uploaded_df
    # 1. Verify Firebase ID token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    id_token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_email = decoded_token.get("email")
    if user_email not in ALLOWED_ADMINS:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Read and store CSV for later prediction
    df = pd.read_csv(file.file, encoding="latin1")
    last_uploaded_df = df.copy()

    # --- ML Logic (moved from /api/admin-predict) ---
    # Predict category (classification)
    if 'category' in df.columns:
        X_cat = df[['price', 'quantity_sold']].fillna(0)
        y_cat = df['category']
        clf = RandomForestClassifier()
        clf.fit(X_cat, y_cat)
        df['predicted_category'] = clf.predict(X_cat)
    else:
        df['predicted_category'] = 'unknown'
    # Predict sales (regression)
    if 'sales' in df.columns:
        X_sales = df[['price', 'quantity_sold']].fillna(0)
        y_sales = df['sales']
        reg = RandomForestRegressor()
        reg.fit(X_sales, y_sales)
        df['predicted_sales'] = reg.predict(X_sales)
    else:
        df['predicted_sales'] = df['price'] * df['quantity_sold']

    # Predict quantity sold (regression or random for demo)
    if 'quantity_sold' in df.columns:
        # You can use a regressor or just copy the column for demo
        df['predicted_quantity_sold'] = df['quantity_sold']
    else:
        df['predicted_quantity_sold'] = np.random.randint(1, 500, len(df))

    # --- Prepare Firestore data for UI ---
    df['date'] = pd.to_datetime(df['date'])
    pieData = [
        {"name": row['product_name'], "value": row['predicted_sales'], "quantity": row['predicted_quantity_sold'], "color": "#a99cff"}
        for _, row in df.iterrows()
    ][:10]
    transactions = [
        {"name": row['product_name'], "amount": row['predicted_sales'], "quantity": row['predicted_quantity_sold'], "date": row['date']}
        for _, row in df.iterrows()
    ][:10]
    topProducts = [
        {"name": row['product_name'], "demand": int(row['quantity_sold']), "quantity": int(row['predicted_quantity_sold']), "color": "#7c8aff"}
        for _, row in df.iterrows()
    ][:10]
    dashboard_data = {
        "pieData": pieData,
        "transactions": transactions,
        "topProducts": topProducts,
        "balance": float(df['predicted_sales'].sum()),
        "balanceChangePercent": 10.0
    }
    monthly = df.groupby(df['date'].dt.strftime('%b'))
    financialData = [
        {
            "month": month,
            "revenue": float(group['predicted_sales'].sum()),
            "expense": float(group['price'].sum()),
            "quantity": int(group['predicted_quantity_sold'].sum())
        }
        for month, group in monthly
    ]
    sales_transactions = [
        {"name": row['product_name'], "date": row['date'], "amount": row['predicted_sales'], "quantity": row['predicted_quantity_sold'], "positive": True}
        for _, row in df.iterrows()
    ][:10]
    orders = [
        {"id": row.get('order_id', f"{i:05d}"), "product": row['product_name'], "customer": row.get('customer', 'N/A'), "price": row['price'], "date": row['date'], "payment": row.get('payment', 'Paid'), "status": row.get('status', 'Shipping'), "predicted_quantity_sold": int(row['predicted_quantity_sold'])}
        for i, row in df.iterrows()
    ][:10]
    sales_data = {
        "financialData": financialData,
        "transactions": sales_transactions,
        "orders": orders
    }
    weeklySalesData = [
        {"week": row.get('week', 'W1'), "sales": row['predicted_sales'], "settlements": row['predicted_sales']*0.8}
        for _, row in df.iterrows()
    ][:10]
    notifications_list = [
        {"type": row.get('notification_type', 'Info'), "item": row.get('notification_item', row['product_name']), "date": row.get('notification_date', row['date']), "details": row.get('notification_details', '')}
        for _, row in df.iterrows()
    ][:10]
    notifications_data = {
        "weeklySalesData": weeklySalesData,
        "notifications": notifications_list
    }
    db_firestore = firestore.client()
    db_firestore.collection("dashboard").document("main").set(dashboard_data)
    db_firestore.collection("sales").document("main").set(sales_data)
    db_firestore.collection("notifications").document("main").set(notifications_data)
    return {"message": "File uploaded, processed, and data pushed to Firestore."}

# --- SMS Endpoints ---
class SMSNotification(BaseModel):
    phone_number: str
    message: str

class InventoryAlert(BaseModel):
    phone_number: str
    product_name: str
    current_stock: int
    threshold: int = 10

class SalesNotification(BaseModel):
    phone_number: str
    total_sales: float
    date: str

class WhatsAppTemplateMessage(BaseModel):
    phone_number: str
    template_sid: str
    variables: dict

class OrderNotification(BaseModel):
    phone_number: str
    delivery_date: str
    delivery_time: str

@app.post("/sms/send", tags=["SMS"])
def send_sms(sms_data: SMSNotification, key: str = Depends(api_key_auth)):
    """Send a custom SMS message"""
    success = send_sms_notification(sms_data.phone_number, sms_data.message)
    if success:
        return {"message": "SMS sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send SMS")

@app.post("/sms/inventory-alert", tags=["SMS"])
def send_inventory_alert_sms(alert_data: InventoryAlert, key: str = Depends(api_key_auth)):
    """Send inventory alert SMS"""
    success = send_inventory_alert(
        alert_data.phone_number, 
        alert_data.product_name, 
        alert_data.current_stock, 
        alert_data.threshold
    )
    if success:
        return {"message": "Inventory alert SMS sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send inventory alert SMS")

@app.post("/sms/sales-report", tags=["SMS"])
def send_sales_report_sms(sales_data: SalesNotification, key: str = Depends(api_key_auth)):
    """Send daily sales report SMS"""
    success = send_sales_notification(
        sales_data.phone_number, 
        sales_data.total_sales, 
        sales_data.date
    )
    if success:
        return {"message": "Sales report SMS sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send sales report SMS")

@app.get("/sms/status", tags=["SMS"])
def get_sms_status(key: str = Depends(api_key_auth)):
    """Check if SMS functionality is available"""
    return {
        "sms_enabled": twilio_client is not None,
        "twilio_configured": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER)
    }

@app.post("/whatsapp/template", tags=["WhatsApp"])
def send_whatsapp_template(template_data: WhatsAppTemplateMessage, key: str = Depends(api_key_auth)):
    """Send WhatsApp message using a template"""
    success = send_whatsapp_template_message(
        template_data.phone_number, 
        template_data.template_sid, 
        template_data.variables
    )
    if success:
        return {"message": "WhatsApp template message sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp template message")

@app.post("/whatsapp/order-notification", tags=["WhatsApp"])
def send_order_notification_whatsapp(order_data: OrderNotification, key: str = Depends(api_key_auth)):
    """Send order notification using WhatsApp template"""
    success = send_order_notification(
        order_data.phone_number, 
        order_data.delivery_date, 
        order_data.delivery_time
    )
    if success:
        return {"message": "Order notification sent successfully via WhatsApp"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send order notification")

@app.post("/inventory/check-and-notify", tags=["Inventory"])
def check_and_notify_inventory(
    phone_number: str = Body(..., embed=True),
    threshold: int = Body(20, embed=True)
):
    """
    Check inventory and send WhatsApp message if any item is below the threshold.
    """
    inventory = get_inventory_from_firestore()
    if not inventory:
        return {"message": "No inventory data found in Firestore."}
    low_stock_items = [
        (item, details.get('quantity', 0))
        for item, details in inventory.items()
        if details.get('quantity', 0) < threshold
    ]
    if not low_stock_items:
        return {"message": "All items are above the threshold."}

    for item, qty in low_stock_items:
        send_sms_notification(
            phone_number,
            f"Alert: Stock for '{item}' is low ({qty} units left). Please restock soon!"
        )
    return {
        "message": f"Notifications sent for {len(low_stock_items)} items below {threshold} units.",
        "low_stock_items": low_stock_items
    }

# Optionally, you can remove or disable /api/admin-predict since it's no longer needed. 