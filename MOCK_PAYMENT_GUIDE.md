# Mock Payment Gateway - Testing Guide

## Overview

TaskPro now includes a **Mock Payment Gateway** for testing the complete registration flow without requiring real Razorpay API keys or making actual payments.

## Features

✅ **Instant Payment Processing** - No need for real payment credentials  
✅ **Full Flow Testing** - Test the entire registration with payment verification  
✅ **Realistic Simulation** - Mimics real Razorpay payment flow  
✅ **Clear Indication** - UI shows when mock payment is being used  
✅ **Easy Toggle** - Switch between mock and real payment with environment variable

## How It Works

### Mock Payment Flow

1. User fills registration form
2. Clicks "PROCEED TO PAYMENT"
3. System detects mock payment mode is enabled
4. Creates mock order ID (format: `mock_order_<timestamp>`)
5. Automatically generates mock payment ID and signature
6. Verifies mock payment instantly
7. Registers user with `is_paid: true` status
8. Redirects to dashboard

### Backend Implementation

The backend checks the `USE_MOCK_PAYMENT` environment variable:

```python
# In server.py
USE_MOCK_PAYMENT = os.environ.get('USE_MOCK_PAYMENT', 'false').lower() == 'true'

# Mock payment order creation
if USE_MOCK_PAYMENT:
    mock_order_id = f"mock_order_{datetime.now(timezone.utc).timestamp()}"
    return {
        "order_id": mock_order_id,
        "amount": order.amount,
        "currency": "INR",
        "mock": True
    }
```

### Frontend Implementation

The frontend automatically detects mock payment mode and handles it:

```javascript
// In AuthPage.js
if (orderResponse.data.mock) {
    // Simulate mock payment flow
    const mockPaymentId = `mock_pay_${Date.now()}`;
    const mockSignature = `mock_sig_${Date.now()}`;
    
    // Verify and register without opening Razorpay
    // ...
}
```

## Configuration

### Enable Mock Payment (Default)

In `/app/backend/.env`:
```env
USE_MOCK_PAYMENT="true"
```

### Disable Mock Payment (Use Real Razorpay)

In `/app/backend/.env`:
```env
USE_MOCK_PAYMENT="false"
RAZORPAY_KEY_ID="rzp_live_your_actual_key"
RAZORPAY_KEY_SECRET="your_actual_secret"
```

Also update `/app/frontend/src/pages/AuthPage.js`:
```javascript
key: "rzp_live_your_actual_key"
```

Then restart services:
```bash
sudo supervisorctl restart backend frontend
```

## Testing Mock Payment

### Via UI (Recommended)

1. Go to https://your-app-url/auth?mode=register
2. Fill in the registration form
3. Note the message: "💡 Testing mode: Mock payment will be used"
4. Click "PROCEED TO PAYMENT"
5. You'll be instantly registered and redirected to dashboard
6. Check the success toast: "Registration successful! (Mock payment used for testing)"

### Via API (curl)

```bash
# Get backend URL
API_URL="https://your-app-url"

# Step 1: Create mock order
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/api/payment/create-order" \
  -H "Content-Type: application/json" \
  -d '{"amount": 49900}')

ORDER_ID=$(echo "$ORDER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['order_id'])")

# Step 2: Verify mock payment
curl -s -X POST "$API_URL/api/payment/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"payment_id\": \"mock_pay_test123\",
    \"signature\": \"mock_sig_test123\"
  }"

# Step 3: Register with mock payment
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"password123\",
    \"name\": \"Test User\",
    \"phone\": \"9876543210\",
    \"payment_order_id\": \"$ORDER_ID\",
    \"payment_id\": \"mock_pay_test123\",
    \"payment_signature\": \"mock_sig_test123\"
  }"
```

## User Account Types

### Paid Account (with mock payment)
```json
{
  "id": "user_1234567890",
  "email": "paid@example.com",
  "name": "Paid User",
  "phone": "9876543210",
  "is_paid": true,
  "created_at": "2025-01-15T10:30:00"
}
```

### Free Account (without payment)
```json
{
  "id": "user_1234567891",
  "email": "free@example.com",
  "name": "Free User",
  "phone": "9876543211",
  "is_paid": false,
  "created_at": "2025-01-15T10:35:00"
}
```

## Mock Payment IDs Format

- **Order ID**: `mock_order_<unix_timestamp>`  
  Example: `mock_order_1766819554.247701`

- **Payment ID**: `mock_pay_<identifier>`  
  Example: `mock_pay_test123` or `mock_pay_1234567890`

- **Signature**: `mock_sig_<identifier>`  
  Example: `mock_sig_test123` or `mock_sig_1234567890`

## Security Notes

⚠️ **IMPORTANT**: Mock payment is for testing only!

- Mock payment IDs are validated with simple prefix checks
- All IDs must start with `mock_` prefix
- No actual payment processing occurs
- Users are marked as `is_paid: true` without payment
- **DO NOT use mock payment in production**

## Switching to Production

When ready for real payments:

1. Get Razorpay live API keys from https://dashboard.razorpay.com
2. Update backend `.env`:
   ```env
   USE_MOCK_PAYMENT="false"
   RAZORPAY_KEY_ID="rzp_live_xxxxx"
   RAZORPAY_KEY_SECRET="your_live_secret"
   ```
3. Update frontend `AuthPage.js` with live key
4. Test with Razorpay test cards first
5. Deploy to production

## Troubleshooting

### Mock payment not working

**Check backend .env:**
```bash
grep USE_MOCK_PAYMENT /app/backend/.env
# Should show: USE_MOCK_PAYMENT="true"
```

**Check backend logs:**
```bash
tail -f /var/log/supervisor/backend.err.log
```

**Restart services:**
```bash
sudo supervisorctl restart backend frontend
```

### User shows is_paid: false after mock payment

This means payment verification failed. Check:
- Order ID starts with `mock_order_`
- Payment ID starts with `mock_pay_`
- Signature starts with `mock_sig_`

### Real Razorpay conflicts with mock

Make sure `USE_MOCK_PAYMENT="false"` and valid Razorpay keys are configured.

## API Endpoints

### Create Payment Order
```
POST /api/payment/create-order
Body: {"amount": 49900}
Response (Mock): {
  "order_id": "mock_order_1766819554.247701",
  "amount": 49900,
  "currency": "INR",
  "mock": true
}
```

### Verify Payment
```
POST /api/payment/verify
Body: {
  "order_id": "mock_order_xxx",
  "payment_id": "mock_pay_xxx",
  "signature": "mock_sig_xxx"
}
Response: {
  "status": "success",
  "message": "Mock payment verified successfully"
}
```

### Register with Payment
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "9876543210",
  "payment_order_id": "mock_order_xxx",
  "payment_id": "mock_pay_xxx",
  "payment_signature": "mock_sig_xxx"
}
Response: {
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "User Name",
    "phone": "9876543210",
    "is_paid": true,
    "created_at": "2025-01-15T10:30:00"
  }
}
```

## Benefits

✅ **No Setup Required** - Works out of the box without Razorpay account  
✅ **Instant Testing** - No waiting for payment confirmation  
✅ **Cost-Free** - No payment gateway charges during development  
✅ **Full Feature Testing** - Test complete registration flow  
✅ **Easy Debugging** - Simple mock IDs make logs easy to read  
✅ **Seamless Switch** - One environment variable to toggle modes

---

**Ready for Testing!** Your TaskPro app now supports hassle-free testing with mock payments while maintaining the ability to switch to real Razorpay when needed.
