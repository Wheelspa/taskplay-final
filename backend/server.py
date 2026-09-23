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
import bcrypt
import random
import resend

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
    is_admin: bool = False
    last_login: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Generic helper function to send emails via Resend with console fallback."""
    api_key = os.environ.get('RESEND_API_KEY', '')
    if not api_key:
        logging.warning(f"[EMAIL FALLBACK] To: {to_email} | Subject: {subject} | Body preview: {html_body[:100]}...")
        print(f"\n[EMAIL SENT TO {to_email}]\nSubject: {subject}\nBody: {html_body}\n")
        return True
    
    try:
        resend.api_key = api_key
        params = {
            "from": "TaskPlay <noreply@taskplay.in>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logging.info(f"Email sent via Resend to {to_email}: {response}")
        print(f"\n[RESEND EMAIL SENT] To: {to_email} | Response: {response}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email via Resend to {to_email}: {e}")
        print(f"\n[RESEND EMAIL FAILED] To: {to_email} | Error: {e}")
        return False

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
    is_pinned: Optional[bool] = False
    assigned_to_user_id: Optional[str] = None
    assigned_by_name: Optional[str] = None

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
    is_pinned: Optional[bool] = None
    assigned_to_user_id: Optional[str] = None
    assigned_by_name: Optional[str] = None

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
    is_pinned: bool = False
    assigned_to_user_id: Optional[str] = None
    assigned_by_name: Optional[str] = None

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

# Checklist Models
class ChecklistCreate(BaseModel):
    title: str

class ChecklistUpdate(BaseModel):
    title: Optional[str] = None

class ChecklistItemCreate(BaseModel):
    text: str
    priority: Optional[str] = "medium"

class ChecklistItemUpdate(BaseModel):
    text: Optional[str] = None
    is_checked: Optional[bool] = None
    priority: Optional[str] = None
    order: Optional[int] = None

class ChecklistItemResponse(BaseModel):
    id: str
    checklist_id: str
    text: str
    is_checked: bool = False
    order: int = 0
    priority: str = "medium"
    created_at: str

class ChecklistResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    items: Optional[List[ChecklistItemResponse]] = []
    item_count: Optional[int] = 0
    completed_item_count: Optional[int] = 0

# Quick Task Models
class QuickTaskCreate(BaseModel):
    text: str
    is_checked: Optional[bool] = False
    order: Optional[int] = 0

class QuickTaskUpdate(BaseModel):
    text: Optional[str] = None
    is_checked: Optional[bool] = None
    order: Optional[int] = None

class QuickTaskResponse(BaseModel):
    id: str
    user_id: str
    text: str
    is_checked: bool = False
    order: int = 0
    created_at: str

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        return bcrypt.hashpw(password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))

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

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def get_user_plan_price(user: dict) -> float:
    m_plan = user.get("membership_plan")
    m_type = user.get("membership_type")
    plan_info = None
    if m_plan in MEMBERSHIP_PLANS:
        plan_info = MEMBERSHIP_PLANS[m_plan]
    elif m_type and m_plan and f"{m_type}_{m_plan}" in MEMBERSHIP_PLANS:
        plan_info = MEMBERSHIP_PLANS[f"{m_type}_{m_plan}"]
    
    if plan_info and "amount" in plan_info:
        return plan_info["amount"] / 100.0
    return 0.0

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    basic_users_count = await db.users.count_documents({"membership_type": "basic"})
    premium_users_count = await db.users.count_documents({"membership_type": "premium"})
    paid_users_count = await db.users.count_documents({"is_paid": True})
    unpaid_users_count = total_users - paid_users_count
    
    paid_users = await db.users.find({"is_paid": True}).to_list(10000)
    total_revenue = sum(get_user_plan_price(u) for u in paid_users)
    
    return {
        "total_users": total_users,
        "total_revenue": total_revenue,
        "total_tasks": total_tasks,
        "basic_users_count": basic_users_count,
        "premium_users_count": premium_users_count,
        "paid_users_count": paid_users_count,
        "unpaid_users_count": unpaid_users_count
    }

@api_router.get("/admin/users")
async def get_admin_users(
    search: Optional[str] = None,
    plan: Optional[str] = None,
    paid: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    and_conditions = []
    
    if search and search.strip():
        regex_pattern = {"$regex": search.strip(), "$options": "i"}
        and_conditions.append({"$or": [{"name": regex_pattern}, {"email": regex_pattern}]})
        
    if plan and plan.strip():
        and_conditions.append({"membership_type": plan.strip().lower()})
        
    if paid is not None and str(paid).strip():
        paid_str = str(paid).lower().strip()
        if paid_str == "true":
            and_conditions.append({"is_paid": True})
        elif paid_str == "false":
            and_conditions.append({"$or": [{"is_paid": False}, {"is_paid": {"$exists": False}}]})
            
    if not and_conditions:
        query = {}
    elif len(and_conditions) == 1:
        query = and_conditions[0]
    else:
        query = {"$and": and_conditions}
    
    users = await db.users.find(query).to_list(10000)
    result = []
    for u in users:
        result.append({
            "id": u["_id"],
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "phone": u.get("phone", ""),
            "created_at": u.get("created_at", ""),
            "last_login": u.get("last_login"),
            "is_paid": bool(u.get("is_paid", False)),
            "is_admin": bool(u.get("is_admin", False)),
            "membership_type": u.get("membership_type"),
            "membership_plan": u.get("membership_plan"),
            "membership_expires_at": u.get("membership_expires_at")
        })
    return result

@api_router.get("/admin/users/{user_id}")
async def get_admin_user_detail(user_id: str, admin: dict = Depends(get_current_admin)):
    """Get detailed profile and tasks for a specific user"""
    u = await db.users.find_one({"_id": user_id})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_info = {
        "id": u["_id"],
        "name": u.get("name", ""),
        "email": u.get("email", ""),
        "phone": u.get("phone", ""),
        "created_at": u.get("created_at", ""),
        "last_login": u.get("last_login"),
        "is_paid": bool(u.get("is_paid", False)),
        "is_admin": bool(u.get("is_admin", False)),
        "membership_type": u.get("membership_type"),
        "membership_plan": u.get("membership_plan"),
        "membership_expires_at": u.get("membership_expires_at")
    }
    
    user_phone = u.get("phone")
    query_conditions = [{"created_by": user_id}, {"assigned_to_user_id": user_id}]
    if user_phone:
        query_conditions.append({"assignee_phone": user_phone})
        
    user_tasks = await db.tasks.find({"$or": query_conditions}).to_list(1000)
    
    task_responses = []
    seen_ids = set()
    for task in user_tasks:
        t_id = task["_id"]
        if t_id in seen_ids:
            continue
        seen_ids.add(t_id)
        
        task_responses.append({
            "id": t_id,
            "title": task.get("title", ""),
            "description": task.get("description"),
            "assignee_name": task.get("assignee_name"),
            "assignee_phone": task.get("assignee_phone"),
            "priority": task.get("priority", "medium"),
            "scheduled_date": task.get("scheduled_date"),
            "scheduled_time": task.get("scheduled_time"),
            "status": task.get("status", "pending"),
            "created_by": task.get("created_by", ""),
            "created_at": task.get("created_at", ""),
            "is_pinned": bool(task.get("is_pinned", False)),
            "assigned_to_user_id": task.get("assigned_to_user_id"),
            "assigned_by_name": task.get("assigned_by_name")
        })
        
    return {
        "user": user_info,
        "tasks": task_responses,
        "total_tasks_count": len(task_responses)
    }

@api_router.get("/admin/payments")
async def get_admin_payments(admin: dict = Depends(get_current_admin)):
    paid_users = await db.users.find({"is_paid": True}).to_list(10000)
    records = []
    for u in paid_users:
        amount = get_user_plan_price(u)
        plan = u.get("membership_plan")
        m_type = u.get("membership_type")
        if plan and m_type and f"{m_type}_{plan}" in MEMBERSHIP_PLANS:
            plan_display = f"{m_type.capitalize()} ({plan.capitalize()})"
        elif plan in MEMBERSHIP_PLANS:
            plan_display = plan
        else:
            plan_display = f"{m_type or ''} {plan or ''}".strip() or "N/A"
            
        records.append({
            "id": u["_id"],
            "user_name": u.get("name", ""),
            "user_email": u.get("email", ""),
            "membership_plan": plan_display,
            "amount": amount,
            "date": u.get("upgraded_at") or u.get("created_at", "")
        })
    return records


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
        "is_admin": False,
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
        membership_expires_at=membership_expires_at,
        is_admin=False
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    now_login = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"_id": db_user["_id"]}, {"$set": {"last_login": now_login}})
    
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
        membership_expires_at=db_user.get("membership_expires_at"),
        is_admin=db_user.get("is_admin", False),
        last_login=now_login
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
        membership_expires_at=current_user.get("membership_expires_at"),
        is_admin=current_user.get("is_admin", False),
        last_login=current_user.get("last_login")
    )

# ==================== FORGOT / RESET PASSWORD ENDPOINTS ====================

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Generate and send a 6-digit OTP code to user's email for password reset."""
    user = await db.users.find_one({"email": req.email})
    
    # Always return generic success message to prevent user enumeration
    if user:
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Invalidate previous unused OTPs for this email
        await db.password_reset_otps.update_many(
            {"email": req.email, "used": False},
            {"$set": {"used": True}}
        )
        
        # Save new OTP document
        otp_doc = {
            "email": req.email,
            "otp_code": otp_code,
            "expires_at": expires_at.isoformat(),
            "used": False,
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.password_reset_otps.insert_one(otp_doc)
        
        # Branded HTML email body
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">TASKPLAY</h1>
          </div>
          <div style="padding: 24px 0;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Reset Your Password</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              We received a request to reset your password. Use the 6-digit verification code below to proceed with resetting your TaskPlay account password:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace, Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">{otp_code}</span>
              <p style="color: #64748b; font-size: 13px; margin-top: 8px; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>.</p>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
              If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
            </p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 TaskPlay. Professional task management for modern teams.</p>
          </div>
        </div>
        """
        
        send_email(req.email, "TaskPlay - Password Reset OTP", html_content)
        
    return {"message": "If an account exists with this email address, a password reset OTP has been sent."}


@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    """Verify an OTP code without marking it as used yet."""
    otp_doc = await db.password_reset_otps.find_one({
        "email": req.email,
        "otp_code": req.otp_code.strip(),
        "used": False
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and try again.")
        
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")
        
    await db.password_reset_otps.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"verified": True}}
    )
    
    return {"message": "OTP verified successfully."}


@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Reset user password after valid OTP verification."""
    otp_doc = await db.password_reset_otps.find_one({
        "email": req.email,
        "otp_code": req.otp_code.strip(),
        "used": False,
        "verified": True
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or unverified OTP. Please verify your OTP code first.")
        
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP session has expired. Please request a new OTP.")
        
    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    hashed_password = pwd_context.hash(req.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}}
    )
    
    await db.password_reset_otps.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password has been reset successfully. You can now login with your new password."}

# ==================== CHECKLIST ENDPOINTS ====================

@api_router.post("/checklists", response_model=ChecklistResponse)
async def create_checklist(checklist: ChecklistCreate, current_user: dict = Depends(get_current_user)):
    """Create a new checklist"""
    checklist_id = f"chk_{datetime.now(timezone.utc).timestamp()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    checklist_doc = {
        "_id": checklist_id,
        "user_id": current_user["id"],
        "title": checklist.title,
        "created_at": now_iso
    }
    await db.checklists.insert_one(checklist_doc)
    return ChecklistResponse(
        id=checklist_id,
        user_id=current_user["id"],
        title=checklist.title,
        created_at=now_iso,
        items=[],
        item_count=0,
        completed_item_count=0
    )

@api_router.get("/checklists", response_model=List[ChecklistResponse])
async def get_checklists(current_user: dict = Depends(get_current_user)):
    """Get all checklists for the current user"""
    checklists = await db.checklists.find({"user_id": current_user["id"]}).to_list(1000)
    result = []
    for c in checklists:
        items = await db.checklist_items.find({"checklist_id": c["_id"]}).to_list(1000)
        item_count = len(items)
        completed_count = len([i for i in items if i.get("is_checked", False)])
        result.append(ChecklistResponse(
            id=c["_id"],
            user_id=c["user_id"],
            title=c["title"],
            created_at=c["created_at"],
            items=[
                ChecklistItemResponse(
                    id=i["_id"],
                    checklist_id=i["checklist_id"],
                    text=i["text"],
                    is_checked=i.get("is_checked", False),
                    order=i.get("order", 0),
                    priority=i.get("priority", "medium"),
                    created_at=i["created_at"]
                ) for i in items
            ],
            item_count=item_count,
            completed_item_count=completed_count
        ))
    return result

@api_router.get("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(checklist_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single checklist with its items"""
    checklist = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    items = await db.checklist_items.find({"checklist_id": checklist_id}).sort("order", 1).to_list(1000)
    item_count = len(items)
    completed_count = len([i for i in items if i.get("is_checked", False)])
    
    return ChecklistResponse(
        id=checklist["_id"],
        user_id=checklist["user_id"],
        title=checklist["title"],
        created_at=checklist["created_at"],
        items=[
            ChecklistItemResponse(
                id=i["_id"],
                checklist_id=i["checklist_id"],
                text=i["text"],
                is_checked=i.get("is_checked", False),
                order=i.get("order", 0),
                priority=i.get("priority", "medium"),
                created_at=i["created_at"]
            ) for i in items
        ],
        item_count=item_count,
        completed_item_count=completed_count
    )

@api_router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(checklist_id: str, update: ChecklistUpdate, current_user: dict = Depends(get_current_user)):
    """Update/rename a checklist"""
    existing = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    if update.title:
        await db.checklists.update_one({"_id": checklist_id}, {"$set": {"title": update.title}})
        existing["title"] = update.title
    
    items = await db.checklist_items.find({"checklist_id": checklist_id}).to_list(1000)
    
    return ChecklistResponse(
        id=existing["_id"],
        user_id=existing["user_id"],
        title=existing["title"],
        created_at=existing["created_at"],
        items=[
            ChecklistItemResponse(
                id=i["_id"],
                checklist_id=i["checklist_id"],
                text=i["text"],
                is_checked=i.get("is_checked", False),
                order=i.get("order", 0),
                priority=i.get("priority", "medium"),
                created_at=i["created_at"]
            ) for i in items
        ],
        item_count=len(items),
        completed_item_count=len([i for i in items if i.get("is_checked", False)])
    )

@api_router.delete("/checklists/{checklist_id}")
async def delete_checklist(checklist_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a checklist and all its items"""
    checklist = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    await db.checklist_items.delete_many({"checklist_id": checklist_id})
    await db.checklists.delete_one({"_id": checklist_id})
    
    return {"message": "Checklist deleted successfully"}

@api_router.post("/checklists/{checklist_id}/items", response_model=ChecklistItemResponse)
async def add_checklist_item(checklist_id: str, item: ChecklistItemCreate, current_user: dict = Depends(get_current_user)):
    """Add an item to a checklist"""
    checklist = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    existing_items_count = await db.checklist_items.count_documents({"checklist_id": checklist_id})
    item_id = f"chkitem_{datetime.now(timezone.utc).timestamp()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    item_doc = {
        "_id": item_id,
        "checklist_id": checklist_id,
        "text": item.text,
        "is_checked": False,
        "order": existing_items_count,
        "priority": item.priority or "medium",
        "created_at": now_iso
    }
    
    await db.checklist_items.insert_one(item_doc)
    
    return ChecklistItemResponse(
        id=item_id,
        checklist_id=checklist_id,
        text=item.text,
        is_checked=False,
        order=existing_items_count,
        priority=item.priority or "medium",
        created_at=now_iso
    )

@api_router.put("/checklists/{checklist_id}/items/{item_id}", response_model=ChecklistItemResponse)
@api_router.patch("/checklists/{checklist_id}/items/{item_id}", response_model=ChecklistItemResponse)
async def update_checklist_item(
    checklist_id: str,
    item_id: str,
    item_update: ChecklistItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a checklist item (toggle checked, change text/priority/order)"""
    checklist = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    existing_item = await db.checklist_items.find_one({"_id": item_id, "checklist_id": checklist_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    update_data = {k: v for k, v in item_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.checklist_items.update_one({"_id": item_id}, {"$set": update_data})
    
    updated_item = await db.checklist_items.find_one({"_id": item_id})
    
    return ChecklistItemResponse(
        id=updated_item["_id"],
        checklist_id=updated_item["checklist_id"],
        text=updated_item["text"],
        is_checked=updated_item.get("is_checked", False),
        order=updated_item.get("order", 0),
        priority=updated_item.get("priority", "medium"),
        created_at=updated_item["created_at"]
    )

@api_router.delete("/checklists/{checklist_id}/items/{item_id}")
async def delete_checklist_item(checklist_id: str, item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a checklist item"""
    checklist = await db.checklists.find_one({"_id": checklist_id, "user_id": current_user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    result = await db.checklist_items.delete_one({"_id": item_id, "checklist_id": checklist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return {"message": "Checklist item deleted successfully"}

# ==================== QUICK TASKS ENDPOINTS ====================

@api_router.get("/quick-tasks", response_model=List[QuickTaskResponse])
async def get_quick_tasks(current_user: dict = Depends(get_current_user)):
    """Get all quick tasks for the current user"""
    tasks = await db.quick_tasks.find({"user_id": current_user["id"]}).sort([("order", 1), ("created_at", 1)]).to_list(1000)
    return [
        QuickTaskResponse(
            id=t["_id"],
            user_id=t["user_id"],
            text=t["text"],
            is_checked=t.get("is_checked", False),
            order=t.get("order", 0),
            created_at=t["created_at"]
        ) for t in tasks
    ]

@api_router.post("/quick-tasks", response_model=QuickTaskResponse)
async def create_quick_task(qt: QuickTaskCreate, current_user: dict = Depends(get_current_user)):
    """Create a new quick task"""
    qt_id = f"qt_{datetime.now(timezone.utc).timestamp()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    qt_doc = {
        "_id": qt_id,
        "user_id": current_user["id"],
        "text": qt.text,
        "is_checked": qt.is_checked if qt.is_checked is not None else False,
        "order": qt.order if qt.order is not None else 0,
        "created_at": now_iso
    }
    await db.quick_tasks.insert_one(qt_doc)
    return QuickTaskResponse(
        id=qt_id,
        user_id=current_user["id"],
        text=qt.text,
        is_checked=qt_doc["is_checked"],
        order=qt_doc["order"],
        created_at=now_iso
    )

@api_router.put("/quick-tasks/{qt_id}", response_model=QuickTaskResponse)
@api_router.patch("/quick-tasks/{qt_id}", response_model=QuickTaskResponse)
async def update_quick_task(qt_id: str, qt_update: QuickTaskUpdate, current_user: dict = Depends(get_current_user)):
    """Update a quick task"""
    existing = await db.quick_tasks.find_one({"_id": qt_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Quick task not found")
    
    update_data = {}
    if qt_update.text is not None:
        update_data["text"] = qt_update.text
    if qt_update.is_checked is not None:
        update_data["is_checked"] = qt_update.is_checked
    if qt_update.order is not None:
        update_data["order"] = qt_update.order

    if update_data:
        await db.quick_tasks.update_one({"_id": qt_id}, {"$set": update_data})
    
    updated = await db.quick_tasks.find_one({"_id": qt_id})
    return QuickTaskResponse(
        id=updated["_id"],
        user_id=updated["user_id"],
        text=updated["text"],
        is_checked=updated.get("is_checked", False),
        order=updated.get("order", 0),
        created_at=updated["created_at"]
    )

@api_router.delete("/quick-tasks/{qt_id}")
async def delete_quick_task(qt_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a quick task"""
    result = await db.quick_tasks.delete_one({"_id": qt_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quick task not found")
    return {"message": "Quick task deleted successfully"}

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
            group_name=group["name"],
            is_pinned=task.get("is_pinned", False)
        )
        for task in tasks
    ]

async def resolve_task_assignment(assignee_phone: Optional[str], creator_id: str):
    assigned_to_user_id = None
    if assignee_phone and str(assignee_phone).strip():
        phone_clean = str(assignee_phone).strip()
        matched_user = await db.users.find_one({"phone": phone_clean})
        if matched_user:
            assigned_to_user_id = matched_user["_id"]
            
    creator = await db.users.find_one({"_id": creator_id})
    assigned_by_name = creator.get("name", "Admin") if creator else "Admin"
    
    return assigned_to_user_id, assigned_by_name

# ==================== TASK ENDPOINTS ====================

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_id = f"task_{datetime.now(timezone.utc).timestamp()}"
    
    assigned_to_user_id, assigned_by_name = await resolve_task_assignment(
        task.assignee_phone, current_user["id"]
    )
    
    task_data = task.model_dump()
    task_data["assigned_to_user_id"] = assigned_to_user_id
    task_data["assigned_by_name"] = assigned_by_name
    
    task_doc = {
        "_id": task_id,
        **task_data,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.tasks.insert_one(task_doc)
    
    return TaskResponse(
        id=task_id,
        **task_data,
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
    user_phone = current_user.get("phone")
    or_list = [
        {"created_by": current_user["id"]},
        {"assigned_to_user_id": current_user["id"]}
    ]
    if user_phone:
        or_list.append({"assignee_phone": user_phone})
        
    query = {"$or": or_list}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tasks = await db.tasks.find(query).to_list(1000)
    seen_ids = set()
    result = []
    
    for task in tasks:
        t_id = task["_id"]
        if t_id in seen_ids:
            continue
        seen_ids.add(t_id)
        
        assigned_by_name = task.get("assigned_by_name")
        if not assigned_by_name and task.get("created_by"):
            creator = await db.users.find_one({"_id": task["created_by"]})
            assigned_by_name = creator.get("name", "Unknown") if creator else None

        result.append(TaskResponse(
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
            is_pinned=task.get("is_pinned", False),
            assigned_to_user_id=task.get("assigned_to_user_id"),
            assigned_by_name=assigned_by_name
        ))
    return result

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    user_phone = current_user.get("phone")
    query_conditions = [{"created_by": current_user["id"]}, {"assigned_to_user_id": current_user["id"]}]
    if user_phone:
        query_conditions.append({"assignee_phone": user_phone})
        
    task = await db.tasks.find_one({"_id": task_id, "$or": query_conditions})
    if not task and current_user.get("is_admin"):
        task = await db.tasks.find_one({"_id": task_id})
        
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    assigned_by_name = task.get("assigned_by_name")
    if not assigned_by_name and task.get("created_by"):
        creator = await db.users.find_one({"_id": task["created_by"]})
        assigned_by_name = creator.get("name", "Unknown") if creator else None

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
        updated_at=task.get("updated_at"),
        completed_at=task.get("completed_at"),
        points_earned=task.get("points_earned"),
        group_id=task.get("group_id"),
        is_pinned=task.get("is_pinned", False),
        assigned_to_user_id=task.get("assigned_to_user_id"),
        assigned_by_name=assigned_by_name
    )

@api_router.put("/tasks/{task_id}", response_model=TaskResponse)
@api_router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_phone = current_user.get("phone")
    query_conditions = [{"created_by": current_user["id"]}, {"assigned_to_user_id": current_user["id"]}]
    if user_phone:
        query_conditions.append({"assignee_phone": user_phone})
        
    query = {"_id": task_id}
    if not current_user.get("is_admin"):
        query["$or"] = query_conditions
        
    existing_task = await db.tasks.find_one(query)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update assignment resolution if phone number updated/present
    target_phone = update_data.get("assignee_phone", existing_task.get("assignee_phone"))
    assigned_to_user_id, assigned_by_name = await resolve_task_assignment(
        target_phone, existing_task.get("created_by", current_user["id"])
    )
    update_data["assigned_to_user_id"] = assigned_to_user_id
    update_data["assigned_by_name"] = assigned_by_name

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
        points_earned=updated_task.get("points_earned"),
        group_id=updated_task.get("group_id"),
        is_pinned=updated_task.get("is_pinned", False),
        assigned_to_user_id=updated_task.get("assigned_to_user_id"),
        assigned_by_name=updated_task.get("assigned_by_name")
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

async def init_admin_user():
    try:
        admin_email = "wheelspa.admin@gmail.com"
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            now = datetime.now(timezone.utc)
            one_year_later = now + timedelta(days=365)
            admin_id = f"user_{now.timestamp()}"
            admin_doc = {
                "_id": admin_id,
                "email": admin_email,
                "password": hash_password("ChangeMe123!"),
                "name": "Admin",
                "phone": "0000000000",
                "is_admin": True,
                "is_paid": True,
                "membership_type": "premium",
                "membership_plan": "yearly",
                "membership_expires_at": one_year_later.isoformat(),
                "created_at": now.isoformat()
            }
            await db.users.insert_one(admin_doc)
            logger.info("Admin user created (wheelspa.admin@gmail.com)")
        else:
            await db.users.update_one(
                {"_id": existing_admin["_id"]},
                {"$set": {"is_admin": True, "name": "Admin"}}
            )
            logger.info("Admin user already exists, is_admin set to True")

        # Update Sandeep user account to be a regular user with updated name
        sandeep_user = await db.users.find_one({"email": "warke.sandeep@gmail.com"})
        if sandeep_user:
            await db.users.update_one(
                {"_id": sandeep_user["_id"]},
                {"$set": {"is_admin": False, "name": "Sandeep Warke"}}
            )
            logger.info("Updated warke.sandeep@gmail.com: is_admin=False, name='Sandeep Warke'")
    except Exception as e:
        logger.error(f"Error initializing admin user: {e}")

@app.on_event("startup")
async def startup_event():
    """Run monthly cleanup check and initialize admin user on server startup"""
    await clear_monthly_tasks()
    await init_admin_user()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()