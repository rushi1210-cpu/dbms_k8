import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:3000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            parsed = json.loads(resp_body) if resp_body else {}
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed

results = []

def record(test_num, name, passed, details):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] Test {test_num}: {name} -> {details}")
    results.append({"num": test_num, "name": name, "status": status, "details": details})

# Test 1: Frontend Server check
try:
    with urllib.request.urlopen(f"{FRONTEND_URL}/") as resp:
        html = resp.read().decode("utf-8")
        record(1, "Frontend Server Running", resp.status == 200 and "National Railway Reservation & Management System" in html, f"Status: {resp.status}, Title found in HTML")
except Exception as e:
    record(1, "Frontend Server Running", False, str(e))

# Test 2: Passenger Registration (valid)
test_email = "stage4.passenger@example.com"
reg_data = {
    "fullName": "Stage Four Passenger",
    "email": test_email,
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "mobile": "9876543210"
}
status, body = request("POST", "/api/auth/register", reg_data)
temp_passenger_id = body.get("passenger_id")
record(2, "Passenger Registration", status in (200, 201) and temp_passenger_id is not None, f"Status: {status}, PassengerId: {temp_passenger_id}")

# Test 3: Duplicate Email Rejection
status, body = request("POST", "/api/auth/register", reg_data)
record(3, "Duplicate Email Handled Gracefully", status == 409, f"Status: {status}, Error: {body.get('message')}")

# Test 4: Password Mismatch Rejection
mismatch_data = {
    "fullName": "Mismatch Test",
    "email": "mismatch@example.com",
    "password": "Password@123",
    "confirmPassword": "DifferentPassword@123",
    "mobile": "9876543210"
}
status, body = request("POST", "/api/auth/register", mismatch_data)
record(4, "Password Mismatch Rejected", status == 400, f"Status: {status}, Error: {body.get('message')}")

# Test 5: Passenger Login (valid credentials)
status, body = request("POST", "/api/auth/login", {"email": test_email, "password": "Password@123"})
passenger_token = body.get("token")
record(5, "Passenger Login (Valid)", status == 200 and bool(passenger_token) and body.get("role") == "PASSENGER", f"Status: {status}, Role: {body.get('role')}")

# Test 6: Passenger Login (wrong password)
status, body = request("POST", "/api/auth/login", {"email": test_email, "password": "WrongPassword"})
record(6, "Passenger Login (Invalid Password)", status == 401, f"Status: {status}, Error: {body.get('message')}")

# Test 7: Passenger Dashboard (Get Profile)
status, profile_body = request("GET", "/api/passengers/profile", token=passenger_token)
record(7, "Passenger Profile Loading", status == 200 and profile_body.get("email") == test_email, f"Status: {status}, FullName: {profile_body.get('full_name')}")

# Test 8: Passenger Profile Update (Edit Name & Mobile)
status, updated_profile = request("PUT", "/api/passengers/profile", {
    "fullName": "Updated Stage Four Name",
    "mobile": "9988776655"
}, token=passenger_token)
record(8, "Passenger Profile Update", status == 200 and updated_profile.get("full_name") == "Updated Stage Four Name" and updated_profile.get("mobile") == "9988776655", f"Status: {status}, New Name: {updated_profile.get('full_name')}, Mobile: {updated_profile.get('mobile')}")

# Test 9: Admin Login
status, admin_body = request("POST", "/api/admin/login", {"email": "admin@railway.com", "password": "Admin@123"})
admin_token = admin_body.get("token")
record(9, "Admin Login", status == 200 and bool(admin_token) and admin_body.get("role") == "ADMIN", f"Status: {status}, Role: {admin_body.get('role')}")

# Test 10: Passenger Attempting Admin Access (Must be 403 Forbidden)
status, body = request("GET", "/api/admin/statistics", token=passenger_token)
record(10, "Passenger Denied on Admin Endpoints", status == 403, f"Status: {status}, Message: {body.get('message')}")

# Test 11: Admin Dynamic Statistics
status, stats_body = request("GET", "/api/admin/statistics", token=admin_token)
total_users = stats_body.get("totalUsers", 0)
total_passengers = stats_body.get("totalPassengers", 0)
record(11, "Admin Statistics", status == 200 and total_users >= 10002 and total_passengers >= 10001, f"TotalUsers: {total_users}, TotalPassengers: {total_passengers}, Active: {stats_body.get('activeUsers')}, Inactive: {stats_body.get('inactiveUsers')}")

# Test 12: Admin Passenger Table & Pagination
status, page_body = request("GET", "/api/admin/passengers?page=0&size=10", token=admin_token)
content = page_body.get("content", [])
record(12, "Server-side Pagination", status == 200 and len(content) == 10 and page_body.get("totalElements") >= 10001, f"Page: {page_body.get('page')}, Size: {page_body.get('size')}, TotalPages: {page_body.get('totalPages')}, Elements: {page_body.get('totalElements')}")

# Test 13: Admin Search by synthetic email
status, search_body = request("GET", "/api/admin/passengers?search=passenger00042@railwaydemo.com", token=admin_token)
search_content = search_body.get("content", [])
record(13, "Admin Search by Email", status == 200 and len(search_content) == 1 and search_content[0].get("email") == "passenger00042@railwaydemo.com", f"Results: {len(search_content)}, Found: {search_content[0].get('email') if search_content else None}")

# Test 14: Admin Search by Name substring
status, search_body = request("GET", "/api/admin/passengers?search=Suresh", token=admin_token)
record(14, "Admin Search by Name", status == 200 and len(search_body.get("content", [])) > 0, f"Found count: {search_body.get('totalElements')}")

# Test 15: Admin View Passenger Details by ID
status, view_body = request("GET", f"/api/admin/passengers/{temp_passenger_id}", token=admin_token)
record(15, "Admin View Passenger by ID", status == 200 and view_body.get("passenger_id") == temp_passenger_id, f"PassengerId: {view_body.get('passenger_id')}, Email: {view_body.get('email')}")

# Test 16: Admin Edit Passenger Profile
status, edit_body = request("PUT", f"/api/admin/passengers/{temp_passenger_id}", {
    "fullName": "Admin Renamed Passenger",
    "mobile": "9123456780"
}, token=admin_token)
record(16, "Admin Edit Passenger", status == 200 and edit_body.get("full_name") == "Admin Renamed Passenger", f"Updated Name: {edit_body.get('full_name')}, Mobile: {edit_body.get('mobile')}")

# Test 17: Admin Deactivate Status
status, deact_body = request("PATCH", f"/api/admin/passengers/{temp_passenger_id}/status", {"status": "INACTIVE"}, token=admin_token)
record(17, "Admin Deactivate Status", status == 200 and deact_body.get("status") == "INACTIVE", f"New Status: {deact_body.get('status')}")

# Test 18: Inactive User Blocked from Login
login_status, login_err = request("POST", "/api/auth/login", {"email": test_email, "password": "Password@123"})
record(18, "Inactive User Cannot Log In", login_status == 401, f"Status: {login_status}, Message: {login_err.get('message')}")

# Test 19: Admin Reactivate Status
status, react_body = request("PATCH", f"/api/admin/passengers/{temp_passenger_id}/status", {"status": "ACTIVE"}, token=admin_token)
record(19, "Admin Reactivate Status", status == 200 and react_body.get("status") == "ACTIVE", f"New Status: {react_body.get('status')}")

# Test 20: Admin Delete Passenger
status, del_body = request("DELETE", f"/api/admin/passengers/{temp_passenger_id}", token=admin_token)
record(20, "Admin Delete Passenger", status == 200 and "deleted successfully" in del_body.get("message", ""), f"Status: {status}, Message: {del_body.get('message')}")

# Test 21: Verify Deleted Passenger 404
status, del_view = request("GET", f"/api/admin/passengers/{temp_passenger_id}", token=admin_token)
record(21, "Deleted Passenger Returns 404", status == 404, f"Status: {status}, Message: {del_view.get('message')}")

# Test 22: Confirm password_hash is NEVER exposed in any API response
all_resps = [
    request("GET", "/api/admin/statistics", token=admin_token)[1],
    request("GET", "/api/admin/passengers?page=0&size=5", token=admin_token)[1],
    request("GET", "/api/admin/passengers/1", token=admin_token)[1]
]
leaked = any("password_hash" in json.dumps(r) or "passwordHash" in json.dumps(r) for r in all_resps)
record(22, "No password_hash exposed in responses", not leaked, f"Password hash leaked: {leaked}")

total_passed = sum(1 for r in results if r["status"] == "PASS")
print(f"\n==========================================")
print(f"Total Tests: {len(results)}, Passed: {total_passed}, Failed: {len(results) - total_passed}")
print(f"==========================================")
if total_passed < len(results):
    sys.exit(1)
