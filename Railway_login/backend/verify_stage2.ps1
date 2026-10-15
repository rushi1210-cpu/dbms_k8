$testEmail = "rohit.sharma" + (Get-Random -Minimum 1000 -Maximum 9999) + "@railway.test"
$testPassword = "SecurePassword@123"
$testMobile = "9876543210"

Write-Output "=================================================="
Write-Output "STAGE 2 VERIFICATION TEST SUITE"
Write-Output "=================================================="

# ------------------------------------------------------------------
# 1. POST /api/auth/register
# ------------------------------------------------------------------
Write-Output "`n--- 1. POST /api/auth/register ---"

# 1a. Valid Registration
$regObj = @{
    fullName = "Rohit Sharma"
    email = $testEmail
    password = $testPassword
    confirmPassword = $testPassword
    mobile = $testMobile
}
$regJson = $regObj | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $regJson
    Write-Output "1a. Valid Registration: STATUS $($regResponse.StatusCode)"
    Write-Output "Payload: $($regResponse.Content)"
} catch {
    Write-Output "1a. Valid Registration FAILED: $($_.Exception.Message)"
}

# 1b. Duplicate Email
try {
    $dupResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $regJson
    Write-Output "1b. Duplicate Email: STATUS $($dupResponse.StatusCode)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
    Write-Output "1b. Duplicate Email: STATUS $status"
    Write-Output "Payload: $body"
}

# 1c. Password Mismatch
$misObj = @{
    fullName = "Rohit Sharma"
    email = "mismatch" + (Get-Random) + "@railway.test"
    password = "PasswordOne@123"
    confirmPassword = "PasswordTwo@456"
    mobile = "9876543210"
}
$misJson = $misObj | ConvertTo-Json

try {
    $misResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $misJson
    Write-Output "1c. Password Mismatch: STATUS $($misResponse.StatusCode)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
    Write-Output "1c. Password Mismatch: STATUS $status"
    Write-Output "Payload: $body"
}

# ------------------------------------------------------------------
# 2. POST /api/auth/login
# ------------------------------------------------------------------
Write-Output "`n--- 2. POST /api/auth/login ---"

# 2a. Correct Email / Password
$loginGoodObj = @{
    email = $testEmail
    password = $testPassword
}
$loginGoodJson = $loginGoodObj | ConvertTo-Json

$jwtToken = ""
try {
    $loginGoodResp = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginGoodJson
    Write-Output "2a. Correct Login: STATUS $($loginGoodResp.StatusCode)"
    Write-Output "Payload: $($loginGoodResp.Content)"
    $parsedLogin = $loginGoodResp.Content | ConvertFrom-Json
    $jwtToken = $parsedLogin.token
} catch {
    Write-Output "2a. Correct Login FAILED: $($_.Exception.Message)"
}

# 2b. Incorrect Password
$loginBadObj = @{
    email = $testEmail
    password = "WrongPassword!999"
}
$loginBadJson = $loginBadObj | ConvertTo-Json

try {
    $loginBadResp = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBadJson
    Write-Output "2b. Incorrect Password: STATUS $($loginBadResp.StatusCode)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
    Write-Output "2b. Incorrect Password: STATUS $status"
    Write-Output "Payload: $body"
}

# ------------------------------------------------------------------
# 3. GET /api/passengers/profile
# ------------------------------------------------------------------
Write-Output "`n--- 3. GET /api/passengers/profile ---"

# 3a. Without JWT
try {
    $noJwtResp = Invoke-WebRequest -Uri "http://localhost:8080/api/passengers/profile" -Method Get
    Write-Output "3a. Profile Without JWT: STATUS $($noJwtResp.StatusCode)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
    Write-Output "3a. Profile Without JWT: STATUS $status"
    Write-Output "Payload: $body"
}

# 3b. With Valid JWT
try {
    $headers = @{ "Authorization" = "Bearer $jwtToken" }
    $jwtResp = Invoke-WebRequest -Uri "http://localhost:8080/api/passengers/profile" -Method Get -Headers $headers
    Write-Output "3b. Profile With Valid JWT: STATUS $($jwtResp.StatusCode)"
    Write-Output "Payload: $($jwtResp.Content)"
} catch {
    Write-Output "3b. Profile With Valid JWT FAILED: $($_.Exception.Message)"
}

# ------------------------------------------------------------------
# 4. PUT /api/passengers/profile
# ------------------------------------------------------------------
Write-Output "`n--- 4. PUT /api/passengers/profile ---"

# 4a. Valid Update & 4b. Verify immutable fields cannot be changed
$updateObj = @{
    full_name = "Rohit S. Sharma"
    mobile = "9822334455"
    email = "hacker@test.com"
    role = "ADMIN"
    status = "SUSPENDED"
    user_id = 9999
    passenger_id = 8888
    password_hash = "fake_hash"
}
$updateJson = $updateObj | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $jwtToken"
        "Content-Type" = "application/json"
    }
    $updateResp = Invoke-WebRequest -Uri "http://localhost:8080/api/passengers/profile" -Method Put -Headers $headers -Body $updateJson
    Write-Output "4. Profile Update: STATUS $($updateResp.StatusCode)"
    Write-Output "Update Response Payload: $($updateResp.Content)"

    # Verify with subsequent GET
    $verifyGet = Invoke-WebRequest -Uri "http://localhost:8080/api/passengers/profile" -Method Get -Headers @{ "Authorization" = "Bearer $jwtToken" }
    Write-Output "Subsequent GET Verification: $($verifyGet.Content)"
} catch {
    Write-Output "4. Profile Update FAILED: $($_.Exception.Message)"
}

# ------------------------------------------------------------------
# 5. Database Verification (Direct MySQL query)
# ------------------------------------------------------------------
Write-Output "`n--- 5. MySQL Database Verification ---"
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pRushi@12 -e "USE railway_management; SELECT user_id, email, password_hash, role, status FROM users WHERE email='$testEmail'; SELECT p.passenger_id, p.user_id, p.full_name, p.mobile, u.email FROM passengers p JOIN users u ON p.user_id = u.user_id WHERE u.email='$testEmail';"
