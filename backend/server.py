from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60

razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

app = FastAPI()
api_router = APIRouter(prefix="/api")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    payment_order_id: Optional[str] = None
    payment_id: Optional[str] = None
    payment_signature: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    created_at: str
    is_paid: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_phone: Optional[str] = None
    priority: str = "medium"
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None
    status: str = "pending"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_phone: Optional[str] = None
    priority: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_phone: Optional[str] = None
    priority: str
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None
    status: str
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

class PaymentOrderCreate(BaseModel):
    amount: int

class PaymentVerify(BaseModel):
    order_id: str
    payment_id: str
    signature: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@api_router.post("/payment/create-order")
async def create_payment_order(order: PaymentOrderCreate):
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": order.amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(payment: PaymentVerify):
    try:
        params_dict = {
            'razorpay_order_id': payment.order_id,
            'razorpay_payment_id': payment.payment_id,
            'razorpay_signature': payment.signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        return {"status": "success", "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    is_paid = False
    if user.payment_order_id and user.payment_id and user.payment_signature:
        try:
            params_dict = {
                'razorpay_order_id': user.payment_order_id,
                'razorpay_payment_id': user.payment_id,
                'razorpay_signature': user.payment_signature
            }
            razorpay_client.utility.verify_payment_signature(params_dict)
            is_paid = True
        except:
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    user_id = f"user_{datetime.now(timezone.utc).timestamp()}"
    user_doc = {
        "_id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "is_paid": is_paid,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        created_at=user_doc["created_at"],
        is_paid=is_paid
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user["_id"]})
    
    user_response = UserResponse(
        id=db_user["_id"],
        email=db_user["email"],
        name=db_user["name"],
        phone=db_user["phone"],
        created_at=db_user["created_at"],
        is_paid=db_user.get("is_paid", False)
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        phone=current_user["phone"],
        created_at=current_user["created_at"],
        is_paid=current_user.get("is_paid", False)
    )

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_id = f"task_{datetime.now(timezone.utc).timestamp()}"
    task_doc = {
        "_id": task_id,
        **task.model_dump(),
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.tasks.insert_one(task_doc)
    
    return TaskResponse(
        id=task_id,
        **task.model_dump(),
        created_by=current_user["id"],
        created_at=task_doc["created_at"],
        updated_at=None
    )

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"created_by": current_user["id"]}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    
    return [
        TaskResponse(
            id=task["id"],
            title=task["title"],
            description=task.get("description"),
            assignee_name=task.get("assignee_name"),
            assignee_phone=task.get("assignee_phone"),
            priority=task["priority"],
            scheduled_date=task.get("scheduled_date"),
            scheduled_time=task.get("scheduled_time"),
            location_lat=task.get("location_lat"),
            location_lng=task.get("location_lng"),
            location_address=task.get("location_address"),
            status=task["status"],
            created_by=task["created_by"],
            created_at=task["created_at"],
            updated_at=task.get("updated_at")
        )
        for task in tasks
    ]

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": task_id, "created_by": current_user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task["id"],
        title=task["title"],
        description=task.get("description"),
        assignee_name=task.get("assignee_name"),
        assignee_phone=task.get("assignee_phone"),
        priority=task["priority"],
        scheduled_date=task.get("scheduled_date"),
        scheduled_time=task.get("scheduled_time"),
        location_lat=task.get("location_lat"),
        location_lng=task.get("location_lng"),
        location_address=task.get("location_address"),
        status=task["status"],
        created_by=task["created_by"],
        created_at=task["created_at"],
        updated_at=task.get("updated_at")
    )

@api_router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    existing_task = await db.tasks.find_one({"_id": task_id, "created_by": current_user["id"]})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tasks.update_one(
        {"_id": task_id},
        {"$set": update_data}
    )
    
    updated_task = await db.tasks.find_one({"_id": task_id}, {"_id": 0})
    
    return TaskResponse(
        id=updated_task["id"],
        title=updated_task["title"],
        description=updated_task.get("description"),
        assignee_name=updated_task.get("assignee_name"),
        assignee_phone=updated_task.get("assignee_phone"),
        priority=updated_task["priority"],
        scheduled_date=updated_task.get("scheduled_date"),
        scheduled_time=updated_task.get("scheduled_time"),
        location_lat=updated_task.get("location_lat"),
        location_lng=updated_task.get("location_lng"),
        location_address=updated_task.get("location_address"),
        status=updated_task["status"],
        created_by=updated_task["created_by"],
        created_at=updated_task["created_at"],
        updated_at=updated_task.get("updated_at")
    )

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"_id": task_id, "created_by": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

@api_router.get("/tasks/stats/overview")
async def get_task_stats(current_user: dict = Depends(get_current_user)):
    all_tasks = await db.tasks.find({"created_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    total = len(all_tasks)
    pending = len([t for t in all_tasks if t["status"] == "pending"])
    in_progress = len([t for t in all_tasks if t["status"] == "in_progress"])
    completed = len([t for t in all_tasks if t["status"] == "completed"])
    high_priority = len([t for t in all_tasks if t["priority"] == "high"])
    
    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "high_priority": high_priority
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()