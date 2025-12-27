import requests
import sys
import json
from datetime import datetime

class TaskManagementAPITester:
    def __init__(self, base_url="https://taskpro-manager-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_payment_endpoints(self):
        """Test payment related endpoints"""
        print("\n🔍 Testing Payment Endpoints...")
        
        # Test create payment order
        success, response = self.run_test(
            "Create Payment Order",
            "POST",
            "payment/create-order",
            200,
            data={"amount": 49900}
        )
        
        if success and 'order_id' in response:
            order_id = response['order_id']
            
            # Test payment verification (will fail without real payment)
            self.run_test(
                "Payment Verification (Expected to fail)",
                "POST",
                "payment/verify",
                400,  # Expected to fail
                data={
                    "order_id": order_id,
                    "payment_id": "fake_payment_id",
                    "signature": "fake_signature"
                }
            )

    def test_user_registration(self):
        """Test user registration without payment"""
        print("\n🔍 Testing User Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "phone": f"9876543{timestamp[-3:]}"
        }
        
        success, response = self.run_test(
            "User Registration (without payment)",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return test_user_data
        
        return None

    def test_user_login(self, user_data):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        if not user_data:
            self.log_test("User Login", False, "No user data available")
            return False
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": user_data["email"],
                "password": user_data["password"]
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        
        return False

    def test_auth_me(self):
        """Test get current user"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        return success

    def test_task_operations(self):
        """Test all task CRUD operations"""
        print("\n🔍 Testing Task Operations...")
        
        # Test create task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task for API testing",
            "assignee_name": "John Doe",
            "assignee_phone": "9876543210",
            "priority": "high",
            "scheduled_date": "2025-01-15",
            "scheduled_time": "10:30",
            "location_lat": 28.6139,
            "location_lng": 77.2090,
            "location_address": "New Delhi, India",
            "status": "pending"
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        
        if not success:
            return None
        
        task_id = response.get('id')
        if not task_id:
            self.log_test("Create Task - Get ID", False, "No task ID in response")
            return None
        
        # Test get all tasks
        self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        
        # Test get tasks with filters
        self.run_test(
            "Get Tasks by Status",
            "GET",
            "tasks?status=pending",
            200
        )
        
        self.run_test(
            "Get Tasks by Priority",
            "GET",
            "tasks?priority=high",
            200
        )
        
        # Test get specific task
        self.run_test(
            "Get Specific Task",
            "GET",
            f"tasks/{task_id}",
            200
        )
        
        # Test update task
        update_data = {
            "title": "Updated Test Task",
            "status": "in_progress",
            "priority": "medium"
        }
        
        self.run_test(
            "Update Task",
            "PUT",
            f"tasks/{task_id}",
            200,
            data=update_data
        )
        
        # Test task stats
        self.run_test(
            "Get Task Statistics",
            "GET",
            "tasks/stats/overview",
            200
        )
        
        # Test delete task
        self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        
        # Verify task is deleted
        self.run_test(
            "Verify Task Deleted",
            "GET",
            f"tasks/{task_id}",
            404
        )
        
        return task_id

    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Store current token
        current_token = self.token
        self.token = None
        
        # Test protected endpoints without token
        self.run_test(
            "Unauthorized - Get Tasks",
            "GET",
            "tasks",
            401
        )
        
        self.run_test(
            "Unauthorized - Create Task",
            "POST",
            "tasks",
            401,
            data={"title": "Test"}
        )
        
        self.run_test(
            "Unauthorized - Get User",
            "GET",
            "auth/me",
            401
        )
        
        # Restore token
        self.token = current_token

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting TaskPro API Testing...")
        print(f"Base URL: {self.base_url}")
        
        # Test payment endpoints first
        self.test_payment_endpoints()
        
        # Test user registration
        user_data = self.test_user_registration()
        
        # Test user login
        if user_data:
            self.test_user_login(user_data)
        
        # Test auth endpoints
        if self.token:
            self.test_auth_me()
            
            # Test task operations
            self.test_task_operations()
        
        # Test unauthorized access
        self.test_unauthorized_access()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TaskManagementAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())