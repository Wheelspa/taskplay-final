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
USE_MOCK_PAYMENT = os.environ.get('USE_MOCK_PAYMENT', 'false').lower() == 'true'

razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', ''))) if not USE_MOCK_PAYMENT else None

app = FastAPI()
api_router = APIRouter(prefix="/api")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    membership_plan: Optional[str] = None  # "basic_monthly", "basic_yearly", "premium_monthly", "premium_yearly"
    payment_order_id: Optional[str] = None
    payment_id: Optional[str] = None
    payment_signature: Optional[str] = None
    discount_code: Optional[str] = None

# Discount code configuration
DISCOUNT_CODES = {
    "EARLYBIRD": {
        "discount_percent": 50,
        "expires_at": datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc),
        "description": "50% off Early Bird discount"
    }
}

def validate_discount_code(code: str) -> dict:
    """Validate a discount code and return discount info if valid"""
    if not code:
        return None
    
    code_upper = code.upper().strip()
    if code_upper not in DISCOUNT_CODES:
        return {"valid": False, "error": "Invalid discount code"}
    
    code_info = DISCOUNT_CODES[code_upper]
    now = datetime.now(timezone.utc)
    
    if now > code_info["expires_at"]:
        return {"valid": False, "error": f"Discount code '{code_upper}' has expired"}
    
    return {
        "valid": True,
        "code": code_upper,
        "discount_percent": code_info["discount_percent"],
        "description": code_info["description"]
    }

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
    membership_type: Optional[str] = None  # "basic" or "premium"
    membership_plan: Optional[str] = None  # "monthly" or "yearly"
    membership_expires_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Membership pricing configuration
MEMBERSHIP_PLANS = {
    "basic_monthly": {"type": "basic", "plan": "monthly", "amount": 9000, "display": "₹90/month"},
    "basic_yearly": {"type": "basic", "plan": "yearly", "amount": 49900, "display": "₹499/year"},
    "premium_monthly": {"type": "premium", "plan": "monthly", "amount": 18000, "display": "₹180/month"},
    "premium_yearly": {"type": "premium", "plan": "yearly", "amount": 99900, "display": "₹999/year"}
}

# Task Group Models
class TaskGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"  # Default blue color

class TaskGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    created_by: str
    created_at: str
    task_count: Optional[int] = 0

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
    group_id: Optional[str] = None  # Task group

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
    completed_at: Optional[str] = None
    points_earned: Optional[int] = None
    group_id: Optional[str] = None

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
    completed_at: Optional[str] = None
    points_earned: Optional[int] = None
    team_id: Optional[str] = None
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    assigned_to: Optional[List[str]] = None

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None

class TeamResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    owner_id: str
    created_at: str
    member_count: int

class TeamMemberAdd(BaseModel):
    user_email: str
    role: str = "member"

class TeamMemberResponse(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    role: str
    joined_at: str

class CommentCreate(BaseModel):
    task_id: str
    content: str

class CommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    user_name: str
    content: str
    created_at: str

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

def calculate_task_points(priority: str) -> int:
    """Calculate points earned for completing a task based on priority"""
    points_map = {
        "super_important": 5,
        "high": 4,
        "medium": 3,
        "low": 2
    }
    return points_map.get(priority, 1)

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
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    # Convert _id to id for consistency
    user["id"] = user["_id"]
    return user

@api_router.get("/debug/razorpay-check")
async def debug_razorpay_check():
    key_id = os.environ.get('RAZORPAY_KEY_ID', '')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
    return {
        "key_id_length": len(key_id),
        "key_id_repr": repr(key_id),
        "secret_length": len(key_secret),
        "secret_repr": repr(key_secret[:5] + "..." + key_secret[-5:]) if len(key_secret) > 10 else repr(key_secret)
    }

@api_router.post("/payment/create-order")
async def create_payment_order(order: PaymentOrderCreate):
    try:
        if USE_MOCK_PAYMENT:
            mock_order_id = f"mock_order_{datetime.now(timezone.utc).timestamp()}"
            return {
                "order_id": mock_order_id,
                "amount": order.amount,
                "currency": "INR",
                "mock": True
            }
        
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
        if USE_MOCK_PAYMENT:
            if payment.order_id.startswith("mock_order_") and payment.payment_id.startswith("mock_pay_"):
                return {"status": "success", "message": "Mock payment verified successfully"}
            raise HTTPException(status_code=400, detail="Invalid mock payment")
        
        params_dict = {
            'razorpay_order_id': payment.order_id,
            'razorpay_payment_id': payment.payment_id,
            'razorpay_signature': payment.signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        return {"status": "success", "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

class UpgradeMembership(BaseModel):
    membership_plan: str
    payment_order_id: str
    payment_id: str
    payment_signature: str

@api_router.post("/membership/upgrade")
async def upgrade_membership(upgrade: UpgradeMembership, current_user: dict = Depends(get_current_user)):
    """Upgrade existing user's membership"""
    try:
        # Verify payment
        if USE_MOCK_PAYMENT:
            if not (upgrade.payment_order_id.startswith("mock_order_") and upgrade.payment_id.startswith("mock_pay_")):
                raise HTTPException(status_code=400, detail="Invalid mock payment")
        else:
            params_dict = {
                'razorpay_order_id': upgrade.payment_order_id,
                'razorpay_payment_id': upgrade.payment_id,
                'razorpay_signature': upgrade.payment_signature
            }
            razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Validate plan
        if upgrade.membership_plan not in MEMBERSHIP_PLANS:
            raise HTTPException(status_code=400, detail="Invalid membership plan")
        
        plan_info = MEMBERSHIP_PLANS[upgrade.membership_plan]
        
        # Calculate expiration
        now = datetime.now(timezone.utc)
        if plan_info["plan"] == "yearly":
            expires = now + timedelta(days=365)
        else:
            expires = now + timedelta(days=30)
        
        # Update user's membership
        await db.users.update_one(
            {"_id": current_user["id"]},
            {
                "$set": {
                    "is_paid": True,
                    "membership_type": plan_info["type"],
                    "membership_plan": plan_info["plan"],
                    "membership_expires_at": expires.isoformat(),
                    "upgraded_at": now.isoformat()
                }
            }
        )
        
        # Fetch updated user
        updated_user = await db.users.find_one({"_id": current_user["id"]})
        
        return {
            "status": "success",
            "message": f"Successfully upgraded to {plan_info['type'].title()} plan",
            "user": UserResponse(
                id=updated_user["_id"],
                email=updated_user["email"],
                name=updated_user["name"],
                phone=updated_user["phone"],
                created_at=updated_user["created_at"],
                is_paid=True,
                membership_type=plan_info["type"],
                membership_plan=plan_info["plan"],
                membership_expires_at=expires.isoformat()
            )
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upgrade failed: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.get("/membership/plans")
async def get_membership_plans():
    """Get available membership plans"""
    return {
        "plans": [
            {
                "id": "basic_monthly",
                "type": "basic",
                "billing": "monthly",
                "price": 90,
                "amount": 9000,  # In paise for Razorpay
                "display": "₹90/month",
                "features": ["Up to 50 tasks/month", "Basic analytics", "Email support"]
            },
            {
                "id": "basic_yearly",
                "type": "basic",
                "billing": "yearly",
                "price": 499,
                "amount": 49900,
                "display": "₹499/year",
                "savings": "Save ₹581 (45%)",
                "features": ["Up to 50 tasks/month", "Basic analytics", "Email support"]
            },
            {
                "id": "premium_monthly",
                "type": "premium",
                "billing": "monthly",
                "price": 180,
                "amount": 18000,
                "display": "₹180/month",
                "features": ["Unlimited tasks", "Advanced analytics", "Team collaboration", "Priority support", "Custom reports"]
            },
            {
                "id": "premium_yearly",
                "type": "premium",
                "billing": "yearly",
                "price": 999,
                "amount": 99900,
                "display": "₹999/year",
                "savings": "Save ₹1,161 (54%)",
                "features": ["Unlimited tasks", "Advanced analytics", "Team collaboration", "Priority support", "Custom reports"]
            }
        ]
    }

@api_router.post("/discount/validate")
async def validate_discount(code: str):
    """Validate a discount code and return discount info"""
    result = validate_discount_code(code)
    if not result:
        return {"valid": False, "error": "No discount code provided"}
    return result

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate discount code if provided
    discount_info = None
    if user.discount_code:
        discount_info = validate_discount_code(user.discount_code)
        if discount_info and not discount_info.get("valid"):
            raise HTTPException(status_code=400, detail=discount_info.get("error", "Invalid discount code"))
    
    # Payment is compulsory - membership_plan must be selected
    if not user.membership_plan or user.membership_plan not in MEMBERSHIP_PLANS:
        raise HTTPException(status_code=400, detail="Please select a valid membership plan")
    
    # Payment details are compulsory
    if not (user.payment_order_id and user.payment_id and user.payment_signature):
        raise HTTPException(status_code=400, detail="Payment verification is required to register")
    
    is_paid = False
    membership_type = None
    membership_plan = None
    membership_expires_at = None
    
    if user.payment_order_id and user.payment_id and user.payment_signature:
        try:
            if USE_MOCK_PAYMENT:
                # Verify mock payment
                if user.payment_order_id.startswith("mock_order_") and user.payment_id.startswith("mock_pay_"):
                    is_paid = True
                else:
                    raise HTTPException(status_code=400, detail="Invalid mock payment")
            else:
                # Verify real Razorpay payment
                params_dict = {
                    'razorpay_order_id': user.payment_order_id,
                    'razorpay_payment_id': user.payment_id,
                    'razorpay_signature': user.payment_signature
                }
                razorpay_client.utility.verify_payment_signature(params_dict)
                is_paid = True
            
            # Set membership details if payment verified
            if is_paid and user.membership_plan and user.membership_plan in MEMBERSHIP_PLANS:
                plan_info = MEMBERSHIP_PLANS[user.membership_plan]
                membership_type = plan_info["type"]
                membership_plan = plan_info["plan"]
                
                # Calculate expiration
                now = datetime.now(timezone.utc)
                if membership_plan == "yearly":
                    expires = now + timedelta(days=365)
                else:
                    expires = now + timedelta(days=30)
                membership_expires_at = expires.isoformat()
                
        except Exception as e:
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    user_id = f"user_{datetime.now(timezone.utc).timestamp()}"
    user_doc = {
        "_id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "is_paid": is_paid,
        "membership_type": membership_type,
        "membership_plan": membership_plan,
        "membership_expires_at": membership_expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "discount_code_used": user.discount_code.upper() if user.discount_code else None
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        created_at=user_doc["created_at"],
        is_paid=is_paid,
        membership_type=membership_type,
        membership_plan=membership_plan,
        membership_expires_at=membership_expires_at
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
        is_paid=db_user.get("is_paid", False),
        membership_type=db_user.get("membership_type"),
        membership_plan=db_user.get("membership_plan"),
        membership_expires_at=db_user.get("membership_expires_at")
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
        is_paid=current_user.get("is_paid", False),
        membership_type=current_user.get("membership_type"),
        membership_plan=current_user.get("membership_plan"),
        membership_expires_at=current_user.get("membership_expires_at")
    )

# ==================== TASK GROUP ENDPOINTS ====================

@api_router.post("/task-groups", response_model=TaskGroupResponse)
async def create_task_group(group: TaskGroupCreate, current_user: dict = Depends(get_current_user)):
    """Create a new task group"""
    group_id = f"group_{datetime.now(timezone.utc).timestamp()}"
    group_doc = {
        "_id": group_id,
        "name": group.name,
        "description": group.description,
        "color": group.color or "#3B82F6",
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.task_groups.insert_one(group_doc)
    
    return TaskGroupResponse(
        id=group_id,
        name=group.name,
        description=group.description,
        color=group_doc["color"],
        created_by=current_user["id"],
        created_at=group_doc["created_at"],
        task_count=0
    )

@api_router.get("/task-groups", response_model=List[TaskGroupResponse])
async def get_task_groups(current_user: dict = Depends(get_current_user)):
    """Get all task groups for the current user"""
    groups = await db.task_groups.find({"created_by": current_user["id"]}).to_list(100)
    
    result = []
    for group in groups:
        task_count = await db.tasks.count_documents({
            "created_by": current_user["id"],
            "group_id": group["_id"]
        })
        result.append(TaskGroupResponse(
            id=group["_id"],
            name=group["name"],
            description=group.get("description"),
            color=group.get("color", "#3B82F6"),
            created_by=group["created_by"],
            created_at=group["created_at"],
            task_count=task_count
        ))
    
    return result

@api_router.get("/task-groups/{group_id}", response_model=TaskGroupResponse)
async def get_task_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific task group"""
    group = await db.task_groups.find_one({"_id": group_id, "created_by": current_user["id"]})
    if not group:
        raise HTTPException(status_code=404, detail="Task group not found")
    
    task_count = await db.tasks.count_documents({
        "created_by": current_user["id"],
        "group_id": group_id
    })
    
    return TaskGroupResponse(
        id=group["_id"],
        name=group["name"],
        description=group.get("description"),
        color=group.get("color", "#3B82F6"),
        created_by=group["created_by"],
        created_at=group["created_at"],
        task_count=task_count
    )

@api_router.put("/task-groups/{group_id}", response_model=TaskGroupResponse)
async def update_task_group(group_id: str, group: TaskGroupCreate, current_user: dict = Depends(get_current_user)):
    """Update a task group"""
    existing = await db.task_groups.find_one({"_id": group_id, "created_by": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Task group not found")
    
    await db.task_groups.update_one(
        {"_id": group_id},
        {"$set": {"name": group.name, "description": group.description, "color": group.color}}
    )
    
    task_count = await db.tasks.count_documents({
        "created_by": current_user["id"],
        "group_id": group_id
    })
    
    return TaskGroupResponse(
        id=group_id,
        name=group.name,
        description=group.description,
        color=group.color or "#3B82F6",
        created_by=current_user["id"],
        created_at=existing["created_at"],
        task_count=task_count
    )

@api_router.delete("/task-groups/{group_id}")
async def delete_task_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a task group (tasks will be ungrouped)"""
    group = await db.task_groups.find_one({"_id": group_id, "created_by": current_user["id"]})
    if not group:
        raise HTTPException(status_code=404, detail="Task group not found")
    
    # Ungroup all tasks in this group
    await db.tasks.update_many(
        {"group_id": group_id},
        {"$set": {"group_id": None}}
    )
    
    await db.task_groups.delete_one({"_id": group_id})
    
    return {"message": "Task group deleted successfully"}

@api_router.get("/task-groups/{group_id}/tasks", response_model=List[TaskResponse])
async def get_tasks_in_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Get all tasks in a specific group"""
    group = await db.task_groups.find_one({"_id": group_id, "created_by": current_user["id"]})
    if not group:
        raise HTTPException(status_code=404, detail="Task group not found")
    
    tasks = await db.tasks.find({
        "created_by": current_user["id"],
        "group_id": group_id
    }).to_list(1000)
    
    return [
        TaskResponse(
            id=task["_id"],
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
            updated_at=task.get("updated_at"),
            completed_at=task.get("completed_at"),
            points_earned=task.get("points_earned"),
            group_id=task.get("group_id"),
            group_name=group["name"]
        )
        for task in tasks
    ]

# ==================== TASK ENDPOINTS ====================

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
    
    tasks = await db.tasks.find(query).to_list(1000)
    
    return [
        TaskResponse(
            id=task["_id"],
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
    task = await db.tasks.find_one({"_id": task_id, "created_by": current_user["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task["_id"],
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
    
    # Award points when task is completed
    if task_update.status == "completed" and existing_task.get("status") != "completed":
        points = calculate_task_points(existing_task.get("priority", "medium"))
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["points_earned"] = points
    
    await db.tasks.update_one(
        {"_id": task_id},
        {"$set": update_data}
    )
    
    updated_task = await db.tasks.find_one({"_id": task_id})
    
    return TaskResponse(
        id=updated_task["_id"],
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
        updated_at=updated_task.get("updated_at"),
        completed_at=updated_task.get("completed_at"),
        points_earned=updated_task.get("points_earned")
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

@api_router.get("/tasks/stats/scores")
async def get_score_stats(current_user: dict = Depends(get_current_user)):
    all_tasks = await db.tasks.find({"created_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    # Get today's date
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()
    
    # Get current month start
    month_start = datetime(today.year, today.month, 1).replace(tzinfo=timezone.utc).isoformat()
    
    # Check for delayed tasks and apply penalties
    delayed_task_ids = []
    total_penalties = 0
    monthly_penalties = 0
    
    for task in all_tasks:
        # Skip if already completed or no scheduled date
        if task.get("status") == "completed" or not task.get("scheduled_date"):
            continue
        
        # Skip if penalty already applied
        if task.get("penalty_applied"):
            # Still count the penalty in calculations
            penalty = task.get("penalty_points", 0)
            total_penalties += penalty
            if task.get("penalty_applied_at", "") >= month_start:
                monthly_penalties += penalty
            continue
        
        # Check if task is delayed by more than 3 days
        try:
            scheduled_date_str = task["scheduled_date"]
            # Parse date string (format: YYYY-MM-DD)
            scheduled_date = datetime.strptime(scheduled_date_str, "%Y-%m-%d").date()
            days_delayed = (today - scheduled_date).days
            
            if days_delayed > 3:
                # Apply penalty
                penalty = 5
                await db.tasks.update_one(
                    {"_id": task.get("id", task.get("_id"))},
                    {
                        "$set": {
                            "penalty_applied": True,
                            "penalty_points": penalty,
                            "penalty_applied_at": datetime.now(timezone.utc).isoformat(),
                            "days_delayed": days_delayed
                        }
                    }
                )
                delayed_task_ids.append(task.get("id", task.get("_id")))
                total_penalties += penalty
                monthly_penalties += penalty
        except:
            continue
    
    # Calculate scores
    completed_tasks = [t for t in all_tasks if t.get("completed_at")]
    
    daily_score = sum(
        t.get("points_earned", 0) 
        for t in completed_tasks 
        if t.get("completed_at", "") >= today_start
    )
    
    monthly_points = sum(
        t.get("points_earned", 0) 
        for t in completed_tasks 
        if t.get("completed_at", "") >= month_start
    )
    
    total_points = sum(t.get("points_earned", 0) for t in completed_tasks)
    
    # Apply penalties
    monthly_score = max(0, monthly_points - monthly_penalties)
    total_score = max(0, total_points - total_penalties)
    
    # Determine achievements based on monthly score
    achievements = []
    if monthly_score >= 25:
        achievements.append({
            "level": "bronze",
            "name": "Getting Started",
            "description": "Earned 25+ points this month",
            "icon": "🥉",
            "unlocked": True
        })
    if monthly_score >= 50:
        achievements.append({
            "level": "silver",
            "name": "Productive Worker",
            "description": "Earned 50+ points this month",
            "icon": "🥈",
            "unlocked": True
        })
    if monthly_score >= 75:
        achievements.append({
            "level": "gold",
            "name": "High Achiever",
            "description": "Earned 75+ points this month",
            "icon": "🥇",
            "unlocked": True
        })
    if monthly_score >= 100:
        achievements.append({
            "level": "platinum",
            "name": "Task Master",
            "description": "Earned 100+ points this month",
            "icon": "💎",
            "unlocked": True
        })
    
    return {
        "daily_score": daily_score,
        "monthly_score": monthly_score,
        "total_score": total_score,
        "completed_tasks_count": len(completed_tasks),
        "delayed_tasks_count": len(delayed_task_ids),
        "total_penalties": total_penalties,
        "monthly_penalties": monthly_penalties,
        "achievements": achievements,
        "next_milestone": 25 if monthly_score < 25 else 50 if monthly_score < 50 else 75 if monthly_score < 75 else 100 if monthly_score < 100 else 100
    }

@api_router.get("/tasks/suggestions")
async def get_task_suggestions(current_user: dict = Depends(get_current_user)):
    """Get autocomplete suggestions from user's previous tasks"""
    tasks = await db.tasks.find({"created_by": current_user["id"]}).to_list(100)
    
    titles = list(set([t.get("title", "") for t in tasks if t.get("title")]))
    assignee_names = list(set([t.get("assignee_name", "") for t in tasks if t.get("assignee_name")]))
    assignee_phones = list(set([t.get("assignee_phone", "") for t in tasks if t.get("assignee_phone")]))
    locations = list(set([t.get("location_address", "") for t in tasks if t.get("location_address")]))
    
    return {
        "titles": titles[:20],
        "assignee_names": assignee_names[:20],
        "assignee_phones": assignee_phones[:20],
        "locations": locations[:20]
    }

# ==================== TEAM ENDPOINTS ====================

@api_router.post("/teams", response_model=TeamResponse)
async def create_team(team: TeamCreate, current_user: dict = Depends(get_current_user)):
    """Create a new team"""
    team_id = f"team_{datetime.now(timezone.utc).timestamp()}"
    team_doc = {
        "_id": team_id,
        "name": team.name,
        "description": team.description,
        "logo_url": team.logo_url,
        "owner_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.teams.insert_one(team_doc)
    
    # Add owner as first member
    member_doc = {
        "_id": f"tm_{datetime.now(timezone.utc).timestamp()}",
        "team_id": team_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_email": current_user["email"],
        "role": "owner",
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    await db.team_members.insert_one(member_doc)
    
    return TeamResponse(
        id=team_id,
        name=team.name,
        description=team.description,
        logo_url=team.logo_url,
        owner_id=current_user["id"],
        created_at=team_doc["created_at"],
        member_count=1
    )

@api_router.get("/teams", response_model=List[TeamResponse])
async def get_teams(current_user: dict = Depends(get_current_user)):
    """Get all teams the user is a member of"""
    # Find all team memberships for user
    memberships = await db.team_members.find({"user_id": current_user["id"], "status": "active"}).to_list(100)
    team_ids = [m["team_id"] for m in memberships]
    
    if not team_ids:
        return []
    
    teams = await db.teams.find({"_id": {"$in": team_ids}, "is_active": True}).to_list(100)
    
    result = []
    for team in teams:
        member_count = await db.team_members.count_documents({"team_id": team["_id"], "status": "active"})
        result.append(TeamResponse(
            id=team["_id"],
            name=team["name"],
            description=team.get("description"),
            logo_url=team.get("logo_url"),
            owner_id=team["owner_id"],
            created_at=team["created_at"],
            member_count=member_count
        ))
    
    return result

@api_router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific team"""
    # Check if user is a member
    membership = await db.team_members.find_one({
        "team_id": team_id, 
        "user_id": current_user["id"],
        "status": "active"
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    team = await db.teams.find_one({"_id": team_id, "is_active": True})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    member_count = await db.team_members.count_documents({"team_id": team_id, "status": "active"})
    
    return TeamResponse(
        id=team["_id"],
        name=team["name"],
        description=team.get("description"),
        logo_url=team.get("logo_url"),
        owner_id=team["owner_id"],
        created_at=team["created_at"],
        member_count=member_count
    )

@api_router.get("/teams/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(team_id: str, current_user: dict = Depends(get_current_user)):
    """Get all members of a team"""
    # Check if user is a member
    membership = await db.team_members.find_one({
        "team_id": team_id, 
        "user_id": current_user["id"],
        "status": "active"
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    members = await db.team_members.find({"team_id": team_id, "status": "active"}).to_list(100)
    
    return [
        TeamMemberResponse(
            user_id=m["user_id"],
            user_name=m["user_name"],
            user_email=m["user_email"],
            role=m["role"],
            joined_at=m["joined_at"]
        )
        for m in members
    ]

@api_router.post("/teams/{team_id}/members", response_model=TeamMemberResponse)
async def add_team_member(team_id: str, member: TeamMemberAdd, current_user: dict = Depends(get_current_user)):
    """Add a member to a team (owner/admin only)"""
    # Check if user is owner or admin
    membership = await db.team_members.find_one({
        "team_id": team_id, 
        "user_id": current_user["id"],
        "status": "active",
        "role": {"$in": ["owner", "admin"]}
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Only team owners and admins can add members")
    
    # Find user by email
    user_to_add = await db.users.find_one({"email": member.user_email})
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found with this email")
    
    # Check if already a member
    existing = await db.team_members.find_one({
        "team_id": team_id,
        "user_id": user_to_add["_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")
    
    member_doc = {
        "_id": f"tm_{datetime.now(timezone.utc).timestamp()}",
        "team_id": team_id,
        "user_id": user_to_add["_id"],
        "user_name": user_to_add["name"],
        "user_email": user_to_add["email"],
        "role": member.role,
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "invited_by": current_user["id"],
        "status": "active"
    }
    
    await db.team_members.insert_one(member_doc)
    
    return TeamMemberResponse(
        user_id=user_to_add["_id"],
        user_name=user_to_add["name"],
        user_email=user_to_add["email"],
        role=member.role,
        joined_at=member_doc["joined_at"]
    )

@api_router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(team_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a member from a team"""
    # Check if user is owner or admin (or removing themselves)
    membership = await db.team_members.find_one({
        "team_id": team_id, 
        "user_id": current_user["id"],
        "status": "active"
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    if user_id != current_user["id"] and membership["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can remove other members")
    
    # Can't remove the owner
    member_to_remove = await db.team_members.find_one({"team_id": team_id, "user_id": user_id})
    if member_to_remove and member_to_remove["role"] == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the team owner")
    
    result = await db.team_members.update_one(
        {"team_id": team_id, "user_id": user_id},
        {"$set": {"status": "inactive"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member removed successfully"}

@api_router.get("/teams/{team_id}/tasks", response_model=List[TaskResponse])
async def get_team_tasks(team_id: str, current_user: dict = Depends(get_current_user)):
    """Get all tasks for a team"""
    # Check if user is a member
    membership = await db.team_members.find_one({
        "team_id": team_id, 
        "user_id": current_user["id"],
        "status": "active"
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    tasks = await db.tasks.find({"team_id": team_id}).to_list(1000)
    
    return [
        TaskResponse(
            id=task["_id"],
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
            updated_at=task.get("updated_at"),
            team_id=task.get("team_id"),
            assigned_to=task.get("assigned_to")
        )
        for task in tasks
    ]

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a team (owner only)"""
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the team owner can delete the team")
    
    # Soft delete
    await db.teams.update_one({"_id": team_id}, {"$set": {"is_active": False}})
    await db.team_members.update_many({"team_id": team_id}, {"$set": {"status": "inactive"}})
    
    return {"message": "Team deleted successfully"}

async def clear_monthly_tasks():
    """Clear all tasks at the end of every month - runs on server startup and checks if month changed"""
    try:
        # Get or create cleanup tracking document
        cleanup_doc = await db.system_config.find_one({"_id": "monthly_cleanup"})
        
        today = datetime.now(timezone.utc)
        current_month_key = f"{today.year}-{today.month}"
        
        # If we're in a new month and haven't cleared yet
        if not cleanup_doc or cleanup_doc.get("last_cleanup_month") != current_month_key:
            # Only clear if we're on day 1 of the month OR if it's first startup and we missed the cleanup
            if today.day == 1 or (cleanup_doc and cleanup_doc.get("last_cleanup_month", "") < current_month_key):
                # Clear all tasks from ALL users
                result = await db.tasks.delete_many({})
                logger.info(f"Monthly cleanup: Deleted {result.deleted_count} tasks for month {current_month_key}")
                
                # Update cleanup tracking
                await db.system_config.update_one(
                    {"_id": "monthly_cleanup"},
                    {
                        "$set": {
                            "last_cleanup_month": current_month_key,
                            "last_cleanup_at": today.isoformat(),
                            "tasks_deleted": result.deleted_count
                        }
                    },
                    upsert=True
                )
        else:
            logger.info(f"Monthly cleanup already done for {current_month_key}")
            
    except Exception as e:
        logger.error(f"Error during monthly cleanup: {e}")

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

@app.on_event("startup")
async def startup_event():
    """Run monthly cleanup check on server startup"""
    await clear_monthly_tasks()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()