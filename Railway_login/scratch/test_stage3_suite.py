import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8080"

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

def record(test_name, passed, details):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {test_name}: {details}")
    results.append({"test": test_name, "status": status, "details": details})

# 1. Admin login with valid credentials
status, body = request("POST", "/api/admin/login", {"email": "admin@railway.com", "password": "Admin@123"})
admin_token = body.get("token")
has_pw_hash = "password_hash" in body or "password" in body
record(
    "1. Admin Login (Valid Credentials)",
    status == 200 and admin_token is not None and body.get("role") == "ADMIN" and not has_pw_hash,
    f"Status: {status}, Role: {body.get('role')}, Has token: {bool(admin_token)}, No password_hash exposed: {not has_pw_hash}"
)

# 2. Admin login with invalid password
status, body = request("POST", "/api/admin/login", {"email": "admin@railway.com", "password": "WrongPassword"})
record(
    "2. Admin Login (Invalid Password)",
    status == 401,
    f"Status: {status}, Error: {body.get('message')}"
)

# 3. Passenger login with valid credentials
status, body = request("POST", "/api/auth/login", {"email": "passenger00001@railwaydemo.com", "password": "Passenger@123"})
passenger_token = body.get("token")
record(
    "3. Passenger Login (Valid Credentials)",
    status == 200 and passenger_token is not None and body.get("role") == "PASSENGER",
    f"Status: {status}, Role: {body.get('role')}, Status: {body.get('status')}"
)

# 4. Passenger attempting to log in via /api/admin/login (Must be denied with 403)
status, body = request("POST", "/api/admin/login", {"email": "passenger00001@railwaydemo.com", "password": "Passenger@123"})
record(
    "4. Passenger Denied at Admin Login Endpoint",
    status == 403,
    f"Status: {status}, Message: {body.get('message')}"
)

# 5. Passenger attempting to access Admin Statistics (Must be 403 Forbidden)
status, body = request("GET", "/api/admin/statistics", token=passenger_token)
record(
    "5. Passenger Token Denied on Admin Endpoint",
    status == 403,
    f"Status: {status}, Message: {body.get('message')}"
)

# 6. Unauthenticated request to Admin Statistics (Must be 401 Unauthorized)
status, body = request("GET", "/api/admin/statistics")
record(
    "6. Unauthenticated Access Denied",
    status == 401,
    f"Status: {status}, Message: {body.get('message')}"
)

# 7. Admin Statistics
status, body = request("GET", "/api/admin/statistics", token=admin_token)
total_users = body.get("totalUsers", 0)
total_passengers = body.get("totalPassengers", 0)
active_users = body.get("activeUsers", 0)
record(
    "7. Admin Dynamic Statistics",
    status == 200 and total_users >= 10002 and total_passengers >= 10001,
    f"Status: {status}, totalUsers: {total_users}, totalPassengers: {total_passengers}, activeUsers: {active_users}, inactiveUsers: {body.get('inactiveUsers')}"
)

# 8. Server-side Pagination
status, body = request("GET", "/api/admin/passengers?page=0&size=10", token=admin_token)
passengers = body.get("content", [])
record(
    "8. Passenger List Pagination (Page 0, Size 10)",
    status == 200 and len(passengers) == 10 and body.get("totalElements") >= 10001,
    f"Status: {status}, Received: {len(passengers)} rows, totalElements: {body.get('totalElements')}, totalPages: {body.get('totalPages')}"
)

# 9. Passenger Search by synthetic email
status, body = request("GET", "/api/admin/passengers?search=passenger00042@railwaydemo.com", token=admin_token)
search_results = body.get("content", [])
record(
    "9. Passenger Search by Email",
    status == 200 and len(search_results) == 1 and search_results[0].get("email") == "passenger00042@railwaydemo.com",
    f"Status: {status}, Matched count: {len(search_results)}, Found: {search_results[0].get('email') if search_results else None}"
)

# 10. Passenger Search by name
status, body = request("GET", "/api/admin/passengers?search=Suresh", token=admin_token)
name_results = body.get("content", [])
record(
    "10. Passenger Search by Name Substring",
    status == 200 and len(name_results) > 0,
    f"Status: {status}, Matched count: {body.get('totalElements')}"
)

# 11. View passenger details by ID
target_passenger_id = passengers[0].get("passenger_id")
status, body = request("GET", f"/api/admin/passengers/{target_passenger_id}", token=admin_token)
record(
    "11. Admin View Passenger Details by ID",
    status == 200 and body.get("passenger_id") == target_passenger_id,
    f"Status: {status}, FullName: {body.get('full_name')}, Mobile: {body.get('mobile')}, Email: {body.get('email')}"
)

# 12. Admin view non-existent passenger ID (404)
status, body = request("GET", "/api/admin/passengers/9999999", token=admin_token)
record(
    "12. Admin View Non-Existent Passenger (404)",
    status == 404,
    f"Status: {status}, Error: {body.get('message')}"
)

# 13. Admin update passenger profile (full_name and mobile)
original_name = body.get("full_name", "Original Name")
status, body = request("PUT", f"/api/admin/passengers/{target_passenger_id}", {
    "fullName": "Updated Passenger Name",
    "mobile": "9988776655"
}, token=admin_token)
record(
    "13. Admin Update Passenger Profile",
    status == 200 and body.get("full_name") == "Updated Passenger Name" and body.get("mobile") == "9988776655",
    f"Status: {status}, Updated Name: {body.get('full_name')}, Mobile: {body.get('mobile')}"
)

# 14. Register a dedicated test passenger for activate/deactivate/delete tests
reg_data = {
    "fullName": "Status Test Passenger",
    "email": "temp.status.test@example.com",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "mobile": "9111222333"
}
reg_status, reg_body = request("POST", "/api/auth/register", reg_data)
temp_passenger_id = reg_body.get("passenger_id")
record(
    "14a. Register Temp Test Passenger",
    reg_status in (200, 201) and temp_passenger_id is not None,
    f"Status: {reg_status}, PassengerId: {temp_passenger_id}, Email: {reg_body.get('email')}"
)

# Deactivate temp passenger
status, body = request("PATCH", f"/api/admin/passengers/{temp_passenger_id}/status", {"status": "INACTIVE"}, token=admin_token)
record(
    "14b. Admin Deactivate Passenger Status (INACTIVE)",
    status == 200 and body.get("status") == "INACTIVE",
    f"Status: {status}, New User Status: {body.get('status')}"
)

# Verify inactive user cannot log in
login_status, login_body = request("POST", "/api/auth/login", {"email": "temp.status.test@example.com", "password": "Password@123"})
record(
    "14c. Inactive User Cannot Log In",
    login_status == 401,
    f"Status: {login_status}, Message: {login_body.get('message')}"
)

# Reactivate temp passenger
status, body = request("PATCH", f"/api/admin/passengers/{temp_passenger_id}/status", {"status": "ACTIVE"}, token=admin_token)
record(
    "14d. Admin Reactivate Passenger Status (ACTIVE)",
    status == 200 and body.get("status") == "ACTIVE",
    f"Status: {status}, New User Status: {body.get('status')}"
)

# Verify reactivated user can now log in
login_status, login_body = request("POST", "/api/auth/login", {"email": "temp.status.test@example.com", "password": "Password@123"})
record(
    "14e. Reactivated User Can Log In",
    login_status == 200 and login_body.get("status") == "ACTIVE",
    f"Status: {login_status}, User status: {login_body.get('status')}"
)

# 15. Admin Delete Passenger
status, body = request("DELETE", f"/api/admin/passengers/{temp_passenger_id}", token=admin_token)
record(
    "15a. Admin Delete Passenger",
    status == 200 and "deleted successfully" in body.get("message", ""),
    f"Status: {status}, Message: {body.get('message')}"
)

# Verify deleted passenger returns 404
status, body = request("GET", f"/api/admin/passengers/{temp_passenger_id}", token=admin_token)
record(
    "15b. Deleted Passenger Returns 404",
    status == 404,
    f"Status: {status}, Message: {body.get('message')}"
)

# 16. Verify no password_hash is leaked in any API response
api_responses = [
    request("GET", "/api/admin/statistics", token=admin_token)[1],
    request("GET", "/api/admin/passengers?page=0&size=5", token=admin_token)[1],
    request("GET", f"/api/admin/passengers/{target_passenger_id}", token=admin_token)[1]
]
leaked = any("password_hash" in json.dumps(r) or "passwordHash" in json.dumps(r) for r in api_responses)
record(
    "16. No Password Hashes Leaked in API Responses",
    not leaked,
    f"Password hash leaked: {leaked}"
)

# Restore passenger 1 profile
request("PUT", f"/api/admin/passengers/1", {
    "fullName": "Aarav K. Patel",
    "mobile": "9123456789"
}, token=admin_token)

total_passed = sum(1 for r in results if r["status"] == "PASS")
print(f"\n==========================================")
print(f"Total Tests: {len(results)}, Passed: {total_passed}, Failed: {len(results) - total_passed}")
print(f"==========================================")
if total_passed < len(results):
    sys.exit(1)
