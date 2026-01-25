"""
TaskPro Backend API Tests - Iteration 2
Testing: Task Groups, Discount Validation, Calendar Access, Voice Command (via tasks API)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://taskhero-manage.preview.emergentagent.com').rstrip('/')

class TestDiscountValidation:
    """Test discount code validation endpoint"""
    
    def test_valid_earlybird_code(self):
        """Test EARLYBIRD discount code returns valid:true with 50% discount"""
        response = requests.post(f"{BASE_URL}/api/discount/validate?code=EARLYBIRD")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "EARLYBIRD"
        assert data["discount_percent"] == 50
        assert "description" in data
        print(f"✓ EARLYBIRD code validated: {data}")
    
    def test_earlybird_case_insensitive(self):
        """Test discount code is case insensitive"""
        response = requests.post(f"{BASE_URL}/api/discount/validate?code=earlybird")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "EARLYBIRD"
        print(f"✓ Case insensitive validation works")
    
    def test_invalid_discount_code(self):
        """Test invalid discount code returns valid:false"""
        response = requests.post(f"{BASE_URL}/api/discount/validate?code=INVALID123")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "error" in data
        print(f"✓ Invalid code rejected: {data}")
    
    def test_empty_discount_code(self):
        """Test empty discount code returns valid:false"""
        response = requests.post(f"{BASE_URL}/api/discount/validate?code=")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Empty code handled: {data}")


class TestTaskGroupsCRUD:
    """Test Task Groups CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register a test user and get auth token"""
        timestamp = int(time.time())
        user_data = {
            "email": f"TEST_groups_{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Groups User",
            "phone": "9876543210"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        if response.status_code == 400 and "already registered" in response.text:
            # User exists, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            assert login_response.status_code == 200
            return login_response.json()["access_token"]
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_create_task_group(self, auth_headers):
        """Test creating a new task group"""
        group_data = {
            "name": "TEST_Work Tasks",
            "description": "Tasks related to work",
            "color": "#3B82F6"
        }
        response = requests.post(f"{BASE_URL}/api/task-groups", json=group_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == group_data["name"]
        assert data["description"] == group_data["description"]
        assert data["color"] == group_data["color"]
        assert "id" in data
        assert data["task_count"] == 0
        print(f"✓ Task group created: {data['id']}")
        return data["id"]
    
    def test_get_task_groups(self, auth_headers):
        """Test fetching all task groups"""
        response = requests.get(f"{BASE_URL}/api/task-groups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fetched {len(data)} task groups")
    
    def test_create_and_get_group(self, auth_headers):
        """Test creating a group and fetching it by ID"""
        # Create
        group_data = {
            "name": "TEST_Personal Tasks",
            "description": "Personal stuff",
            "color": "#22C55E"
        }
        create_response = requests.post(f"{BASE_URL}/api/task-groups", json=group_data, headers=auth_headers)
        assert create_response.status_code == 200
        group_id = create_response.json()["id"]
        
        # Get by ID
        get_response = requests.get(f"{BASE_URL}/api/task-groups/{group_id}", headers=auth_headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == group_data["name"]
        assert fetched["id"] == group_id
        print(f"✓ Group created and fetched: {group_id}")
    
    def test_update_task_group(self, auth_headers):
        """Test updating a task group"""
        # Create first
        group_data = {"name": "TEST_Update Group", "description": "Original", "color": "#EF4444"}
        create_response = requests.post(f"{BASE_URL}/api/task-groups", json=group_data, headers=auth_headers)
        assert create_response.status_code == 200
        group_id = create_response.json()["id"]
        
        # Update
        update_data = {"name": "TEST_Updated Group", "description": "Updated description", "color": "#A855F7"}
        update_response = requests.put(f"{BASE_URL}/api/task-groups/{group_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == update_data["name"]
        assert updated["description"] == update_data["description"]
        print(f"✓ Group updated: {group_id}")
    
    def test_delete_task_group(self, auth_headers):
        """Test deleting a task group"""
        # Create first
        group_data = {"name": "TEST_Delete Group", "description": "To be deleted", "color": "#F97316"}
        create_response = requests.post(f"{BASE_URL}/api/task-groups", json=group_data, headers=auth_headers)
        assert create_response.status_code == 200
        group_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/task-groups/{group_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/task-groups/{group_id}", headers=auth_headers)
        assert get_response.status_code == 404
        print(f"✓ Group deleted: {group_id}")
    
    def test_create_task_with_group(self, auth_headers):
        """Test creating a task assigned to a group"""
        # Create group
        group_data = {"name": "TEST_Task Group", "description": "For task assignment", "color": "#14B8A6"}
        group_response = requests.post(f"{BASE_URL}/api/task-groups", json=group_data, headers=auth_headers)
        assert group_response.status_code == 200
        group_id = group_response.json()["id"]
        
        # Create task with group_id
        task_data = {
            "title": "TEST_Task in Group",
            "description": "This task belongs to a group",
            "priority": "high",
            "group_id": group_id
        }
        task_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert task_response.status_code == 200
        task = task_response.json()
        assert task["group_id"] == group_id
        print(f"✓ Task created with group: {task['id']} -> {group_id}")
        
        # Verify group task count increased
        group_get = requests.get(f"{BASE_URL}/api/task-groups/{group_id}", headers=auth_headers)
        assert group_get.status_code == 200
        assert group_get.json()["task_count"] >= 1
        print(f"✓ Group task count updated")


class TestMembershipAndCalendarAccess:
    """Test membership plans and calendar access restrictions"""
    
    def test_get_membership_plans(self):
        """Test fetching available membership plans"""
        response = requests.get(f"{BASE_URL}/api/membership/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        
        # Verify all 4 plans exist
        plan_ids = [p["id"] for p in plans]
        assert "basic_monthly" in plan_ids
        assert "basic_yearly" in plan_ids
        assert "premium_monthly" in plan_ids
        assert "premium_yearly" in plan_ids
        print(f"✓ All 4 membership plans available")
    
    def test_basic_user_registration_with_mock_payment(self):
        """Test registering a basic user with mock payment"""
        timestamp = int(time.time())
        
        # Create mock payment order
        order_response = requests.post(f"{BASE_URL}/api/payment/create-order", json={"amount": 9000})
        assert order_response.status_code == 200
        order_data = order_response.json()
        assert order_data.get("mock") == True
        order_id = order_data["order_id"]
        
        # Register with payment
        user_data = {
            "email": f"TEST_basic_{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Basic User",
            "phone": "9876543210",
            "membership_plan": "basic_monthly",
            "payment_order_id": order_id,
            "payment_id": f"mock_pay_{timestamp}",
            "payment_signature": f"mock_sig_{timestamp}"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["membership_type"] == "basic"
        assert data["user"]["is_paid"] == True
        print(f"✓ Basic user registered with mock payment")
        return data["access_token"]
    
    def test_premium_user_registration_with_mock_payment(self):
        """Test registering a premium user with mock payment"""
        timestamp = int(time.time())
        
        # Create mock payment order
        order_response = requests.post(f"{BASE_URL}/api/payment/create-order", json={"amount": 18000})
        assert order_response.status_code == 200
        order_id = order_response.json()["order_id"]
        
        # Register with payment
        user_data = {
            "email": f"TEST_premium_{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Premium User",
            "phone": "9876543210",
            "membership_plan": "premium_monthly",
            "payment_order_id": order_id,
            "payment_id": f"mock_pay_{timestamp}",
            "payment_signature": f"mock_sig_{timestamp}"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["membership_type"] == "premium"
        assert data["user"]["is_paid"] == True
        print(f"✓ Premium user registered with mock payment")
        return data["access_token"]


class TestTaskCreationViaAPI:
    """Test task creation (used by voice command feature)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register a test user and get auth token"""
        timestamp = int(time.time())
        user_data = {
            "email": f"TEST_voice_{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Voice User",
            "phone": "9876543210"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        if response.status_code == 400:
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            return login_response.json()["access_token"]
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_create_task_minimal(self, auth_headers):
        """Test creating a task with minimal data (like voice command)"""
        task_data = {
            "title": "TEST_Voice Task",
            "priority": "medium",
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["priority"] == task_data["priority"]
        print(f"✓ Minimal task created: {data['id']}")
    
    def test_create_task_with_date(self, auth_headers):
        """Test creating a task with scheduled date"""
        task_data = {
            "title": "TEST_Scheduled Voice Task",
            "priority": "high",
            "scheduled_date": "2026-01-20",
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["scheduled_date"] == task_data["scheduled_date"]
        print(f"✓ Task with date created: {data['id']}")
    
    def test_create_super_important_task(self, auth_headers):
        """Test creating a super important task"""
        task_data = {
            "title": "TEST_Urgent Voice Task",
            "priority": "super_important",
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == "super_important"
        print(f"✓ Super important task created: {data['id']}")


class TestMembershipUpgrade:
    """Test membership upgrade functionality"""
    
    def test_upgrade_basic_to_premium(self):
        """Test upgrading from basic to premium membership"""
        timestamp = int(time.time())
        
        # First register a basic user
        order_response = requests.post(f"{BASE_URL}/api/payment/create-order", json={"amount": 9000})
        order_id = order_response.json()["order_id"]
        
        user_data = {
            "email": f"TEST_upgrade_{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Upgrade User",
            "phone": "9876543210",
            "membership_plan": "basic_monthly",
            "payment_order_id": order_id,
            "payment_id": f"mock_pay_{timestamp}",
            "payment_signature": f"mock_sig_{timestamp}"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Now upgrade to premium
        upgrade_order = requests.post(f"{BASE_URL}/api/payment/create-order", json={"amount": 18000})
        upgrade_order_id = upgrade_order.json()["order_id"]
        
        upgrade_data = {
            "membership_plan": "premium_monthly",
            "payment_order_id": upgrade_order_id,
            "payment_id": f"mock_pay_upgrade_{timestamp}",
            "payment_signature": f"mock_sig_upgrade_{timestamp}"
        }
        upgrade_response = requests.post(f"{BASE_URL}/api/membership/upgrade", json=upgrade_data, headers=headers)
        assert upgrade_response.status_code == 200
        data = upgrade_response.json()
        assert data["user"]["membership_type"] == "premium"
        print(f"✓ User upgraded from basic to premium")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
