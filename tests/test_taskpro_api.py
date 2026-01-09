"""
TaskPro API Tests - Comprehensive backend testing
Tests: Auth, Tasks CRUD, Scores, Achievements, Mock Payment
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_user_{int(time.time())}@test.com"
TEST_PASSWORD = "Test123!"
TEST_NAME = "Test User"
TEST_PHONE = "+1234567890"

# Existing test user from previous tests
EXISTING_EMAIL = "newtest@test.com"
EXISTING_PASSWORD = "Test123!"


class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_reachable(self):
        """Test that API is reachable"""
        response = requests.get(f"{BASE_URL}/api/tasks/stats/overview", timeout=10)
        # Should return 403 (unauthorized) not 500 or connection error
        assert response.status_code in [200, 401, 403, 422], f"API not reachable: {response.status_code}"
        print(f"API reachable - status: {response.status_code}")


class TestMockPayment:
    """Mock payment integration tests"""
    
    def test_create_mock_payment_order(self):
        """Test creating a mock payment order"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={"amount": 9900}  # 99 INR in paise
        )
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        
        data = response.json()
        assert "order_id" in data
        assert data["order_id"].startswith("mock_order_"), "Order ID should be mock format"
        assert data.get("mock") == True, "Should indicate mock payment"
        assert data["amount"] == 9900
        print(f"Mock order created: {data['order_id']}")
        return data["order_id"]
    
    def test_verify_mock_payment(self):
        """Test verifying a mock payment"""
        # First create an order
        order_response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={"amount": 9900}
        )
        order_id = order_response.json()["order_id"]
        
        # Verify with mock payment ID
        mock_payment_id = f"mock_pay_{int(time.time())}"
        response = requests.post(
            f"{BASE_URL}/api/payment/verify",
            json={
                "order_id": order_id,
                "payment_id": mock_payment_id,
                "signature": "mock_signature"
            }
        )
        assert response.status_code == 200, f"Payment verification failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "success"
        print("Mock payment verified successfully")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_register_new_user_without_payment(self):
        """Test user registration without payment"""
        unique_email = f"test_reg_{int(time.time())}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": TEST_PASSWORD,
                "name": TEST_NAME,
                "phone": TEST_PHONE
            }
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["is_paid"] == False, "User without payment should not be paid"
        print(f"User registered: {unique_email}")
        return data
    
    def test_register_with_mock_payment(self):
        """Test user registration with mock payment"""
        # Create mock payment order
        order_response = requests.post(
            f"{BASE_URL}/api/payment/create-order",
            json={"amount": 9900}
        )
        order_id = order_response.json()["order_id"]
        mock_payment_id = f"mock_pay_{int(time.time())}"
        
        unique_email = f"test_paid_{int(time.time())}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": TEST_PASSWORD,
                "name": "Paid User",
                "phone": TEST_PHONE,
                "payment_order_id": order_id,
                "payment_id": mock_payment_id,
                "payment_signature": "mock_signature"
            }
        )
        assert response.status_code == 200, f"Paid registration failed: {response.text}"
        
        data = response.json()
        assert data["user"]["is_paid"] == True, "User with payment should be paid"
        print(f"Paid user registered: {unique_email}")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email fails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": EXISTING_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME,
                "phone": TEST_PHONE
            }
        )
        assert response.status_code == 400, "Duplicate email should fail"
        print("Duplicate email registration correctly rejected")
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": EXISTING_EMAIL,
                "password": EXISTING_PASSWORD
            }
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == EXISTING_EMAIL
        print(f"Login successful for: {EXISTING_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": EXISTING_EMAIL,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401, "Invalid credentials should return 401"
        print("Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD}
        )
        token = login_response.json()["access_token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get user failed: {response.text}"
        
        data = response.json()
        assert data["email"] == EXISTING_EMAIL
        print(f"Current user retrieved: {data['name']}")


class TestTaskCRUD:
    """Task CRUD operations tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_task_basic(self):
        """Test creating a basic task"""
        task_data = {
            "title": f"TEST_Task_{int(time.time())}",
            "description": "Test task description",
            "priority": "medium",
            "status": "pending"
        }
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json=task_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Task creation failed: {response.text}"
        
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["priority"] == "medium"
        assert data["status"] == "pending"
        assert "id" in data
        print(f"Task created: {data['id']}")
        return data["id"]
    
    def test_create_task_with_all_fields(self):
        """Test creating a task with all fields including location"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        task_data = {
            "title": f"TEST_Full_Task_{int(time.time())}",
            "description": "Complete task with all fields",
            "assignee_name": "John Doe",
            "assignee_phone": "+1234567890",
            "priority": "high",
            "scheduled_date": tomorrow,
            "scheduled_time": "14:00",
            "location_lat": 40.7128,
            "location_lng": -74.0060,
            "location_address": "New York, NY",
            "status": "pending"
        }
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json=task_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Full task creation failed: {response.text}"
        
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["assignee_name"] == "John Doe"
        assert data["location_address"] == "New York, NY"
        assert data["scheduled_date"] == tomorrow
        print(f"Full task created with location: {data['id']}")
        return data["id"]
    
    def test_create_super_important_task(self):
        """Test creating a super important priority task"""
        task_data = {
            "title": f"TEST_Super_Important_{int(time.time())}",
            "description": "This is a super important task",
            "priority": "super_important",
            "status": "pending"
        }
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json=task_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Super important task creation failed: {response.text}"
        
        data = response.json()
        assert data["priority"] == "super_important"
        print(f"Super important task created: {data['id']}")
        return data["id"]
    
    def test_get_all_tasks(self):
        """Test getting all tasks"""
        response = requests.get(
            f"{BASE_URL}/api/tasks",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get tasks failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} tasks")
    
    def test_get_tasks_by_status(self):
        """Test filtering tasks by status"""
        response = requests.get(
            f"{BASE_URL}/api/tasks?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        for task in data:
            assert task["status"] == "pending"
        print(f"Retrieved {len(data)} pending tasks")
    
    def test_get_tasks_by_priority(self):
        """Test filtering tasks by priority"""
        response = requests.get(
            f"{BASE_URL}/api/tasks?priority=high",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        for task in data:
            assert task["priority"] == "high"
        print(f"Retrieved {len(data)} high priority tasks")
    
    def test_get_single_task(self):
        """Test getting a single task by ID"""
        # First create a task
        create_response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": f"TEST_Single_{int(time.time())}", "priority": "low"},
            headers=self.headers
        )
        task_id = create_response.json()["id"]
        
        # Get the task
        response = requests.get(
            f"{BASE_URL}/api/tasks/{task_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get single task failed: {response.text}"
        
        data = response.json()
        assert data["id"] == task_id
        print(f"Retrieved task: {task_id}")
    
    def test_update_task_status(self):
        """Test updating task status from pending to in_progress"""
        # Create a task
        create_response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": f"TEST_Update_{int(time.time())}", "priority": "medium"},
            headers=self.headers
        )
        task_id = create_response.json()["id"]
        
        # Update to in_progress
        response = requests.put(
            f"{BASE_URL}/api/tasks/{task_id}",
            json={"status": "in_progress"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "in_progress"
        print(f"Task {task_id} updated to in_progress")
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/tasks/{task_id}",
            headers=self.headers
        )
        assert get_response.json()["status"] == "in_progress"
    
    def test_complete_task_awards_points(self):
        """Test that completing a task awards points"""
        # Create a high priority task (4 points)
        create_response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": f"TEST_Complete_{int(time.time())}", "priority": "high"},
            headers=self.headers
        )
        task_id = create_response.json()["id"]
        
        # Complete the task
        response = requests.put(
            f"{BASE_URL}/api/tasks/{task_id}",
            json={"status": "completed"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Complete failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "completed"
        assert data.get("completed_at") is not None, "completed_at should be set"
        assert data.get("points_earned") == 4, f"High priority should earn 4 points, got {data.get('points_earned')}"
        print(f"Task completed with {data['points_earned']} points")
    
    def test_delete_task(self):
        """Test deleting a task"""
        # Create a task
        create_response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": f"TEST_Delete_{int(time.time())}", "priority": "low"},
            headers=self.headers
        )
        task_id = create_response.json()["id"]
        
        # Delete the task
        response = requests.delete(
            f"{BASE_URL}/api/tasks/{task_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/tasks/{task_id}",
            headers=self.headers
        )
        assert get_response.status_code == 404, "Deleted task should return 404"
        print(f"Task {task_id} deleted successfully")
    
    def test_get_nonexistent_task(self):
        """Test getting a task that doesn't exist"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/nonexistent_task_id",
            headers=self.headers
        )
        assert response.status_code == 404
        print("Nonexistent task correctly returns 404")


class TestScoresAndAchievements:
    """Score tracking and achievements tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_task_stats_overview(self):
        """Test getting task statistics overview"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/stats/overview",
            headers=self.headers
        )
        assert response.status_code == 200, f"Stats overview failed: {response.text}"
        
        data = response.json()
        assert "total" in data
        assert "pending" in data
        assert "in_progress" in data
        assert "completed" in data
        assert "high_priority" in data
        print(f"Stats: total={data['total']}, pending={data['pending']}, completed={data['completed']}")
    
    def test_get_scores_endpoint(self):
        """Test getting scores with achievements"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/stats/scores",
            headers=self.headers
        )
        assert response.status_code == 200, f"Scores endpoint failed: {response.text}"
        
        data = response.json()
        # Verify all required fields
        assert "daily_score" in data
        assert "monthly_score" in data
        assert "total_score" in data
        assert "completed_tasks_count" in data
        assert "achievements" in data
        assert "next_milestone" in data
        
        # Achievements should be a list
        assert isinstance(data["achievements"], list)
        
        print(f"Scores: daily={data['daily_score']}, monthly={data['monthly_score']}, total={data['total_score']}")
        print(f"Achievements unlocked: {len(data['achievements'])}")
        return data
    
    def test_achievements_structure(self):
        """Test that achievements have correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/stats/scores",
            headers=self.headers
        )
        data = response.json()
        
        # If there are achievements, verify structure
        for achievement in data["achievements"]:
            assert "level" in achievement
            assert "name" in achievement
            assert "description" in achievement
            assert "icon" in achievement
            assert achievement["level"] in ["bronze", "silver", "gold", "platinum"]
        
        print(f"Achievement structure verified for {len(data['achievements'])} achievements")
    
    def test_points_by_priority(self):
        """Test that different priorities award different points"""
        priorities_points = {
            "super_important": 5,
            "high": 4,
            "medium": 3,
            "low": 2
        }
        
        for priority, expected_points in priorities_points.items():
            # Create and complete a task
            create_response = requests.post(
                f"{BASE_URL}/api/tasks",
                json={"title": f"TEST_Points_{priority}_{int(time.time())}", "priority": priority},
                headers=self.headers
            )
            task_id = create_response.json()["id"]
            
            # Complete it
            complete_response = requests.put(
                f"{BASE_URL}/api/tasks/{task_id}",
                json={"status": "completed"},
                headers=self.headers
            )
            
            points = complete_response.json().get("points_earned", 0)
            assert points == expected_points, f"{priority} should earn {expected_points} points, got {points}"
            
            # Clean up
            requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=self.headers)
        
        print("All priority point values verified correctly")


class TestTaskSuggestions:
    """Task suggestions/autocomplete tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_suggestions(self):
        """Test getting task suggestions"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/suggestions",
            headers=self.headers
        )
        assert response.status_code == 200, f"Suggestions failed: {response.text}"
        
        data = response.json()
        assert "titles" in data
        assert "assignee_names" in data
        assert "assignee_phones" in data
        assert "locations" in data
        
        assert isinstance(data["titles"], list)
        print(f"Suggestions: {len(data['titles'])} titles, {len(data['assignee_names'])} assignees")


class TestUnauthorizedAccess:
    """Test unauthorized access to protected endpoints"""
    
    def test_tasks_without_auth(self):
        """Test accessing tasks without authentication"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code in [401, 403], f"Should be unauthorized: {response.status_code}"
        print("Tasks endpoint correctly requires auth")
    
    def test_create_task_without_auth(self):
        """Test creating task without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": "Unauthorized task", "priority": "low"}
        )
        assert response.status_code in [401, 403], f"Should be unauthorized: {response.status_code}"
        print("Task creation correctly requires auth")
    
    def test_scores_without_auth(self):
        """Test accessing scores without authentication"""
        response = requests.get(f"{BASE_URL}/api/tasks/stats/scores")
        assert response.status_code in [401, 403], f"Should be unauthorized: {response.status_code}"
        print("Scores endpoint correctly requires auth")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_test_tasks(self):
        """Clean up all TEST_ prefixed tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=self.headers)
        tasks = response.json()
        
        deleted_count = 0
        for task in tasks:
            if task["title"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/tasks/{task['id']}", headers=self.headers)
                deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test tasks")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
