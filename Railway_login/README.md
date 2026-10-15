# Railway Management System (IRCTC-Style)

## Module: Passenger & User Management

This project implements the foundational database and backend layers for the **Passenger & User Management** module of a college-level Railway Management System.

> **Scope Note:** In accordance with project boundaries, this module handles only user credentials and passenger profiles. Other railway modules (train scheduling, seat allocation, booking, PNR, payment, cancellations, food, loyalty, etc.) and frontend/authentication implementations are deferred to subsequent phases.

---

## Technology Stack

- **Backend:** Java 21 LTS, Spring Boot 3.3.5
- **ORM / Persistence:** Spring Data JPA / Hibernate
- **Database:** MySQL 8.x
- **Build Tool:** Apache Maven
- **Frontend (Upcoming Phase):** React.js

---

## Database Architecture

- **Database Name:** `railway_management`
- **Relationship:** `users` 1 : 1 `passengers`
- **Authentication Key:** `email` is the unique login identifier. There is **no username field**.

### 1. Table: `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Primary key identifier |
| `email` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Unique login identifier |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hashed password string |
| `role` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'PASSENGER'` | User role (`PASSENGER`, `ADMIN`, etc.) |
| `status` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'ACTIVE'` | Account status (`ACTIVE`, `SUSPENDED`, etc.) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

### 2. Table: `passengers`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `passenger_id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Primary key identifier |
| `user_id` | `INT` | `NOT NULL`, `UNIQUE`, `FOREIGN KEY` | 1:1 foreign key referencing `users(user_id)` |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Full legal name of passenger |
| `mobile` | `VARCHAR(15)` | `NOT NULL` | Contact mobile number |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Profile creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Profile update timestamp |

---

## Database Setup Instructions

### Step 1: Create the Database & Tables

Log in to your MySQL terminal or MySQL Workbench:

```bash
mysql -u root -p
```

Execute the initialization script:

```sql
CREATE DATABASE IF NOT EXISTS railway_management;
USE railway_management;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PASSENGER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: passengers
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_passengers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

> **Tip:** You can also run the bundled SQL script directly:
> ```bash
> mysql -u root -p < backend/src/main/resources/schema.sql
> ```

---

## Backend Setup & Execution

### Step 2: Configure Database Credentials

Open `backend/src/main/resources/application.properties` and provide your MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:railway_management}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:your_password_here}
```

Or set environment variables before running:
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
```

### Step 3: Build the Backend

Navigate to the `backend` directory and compile the project using Maven:

```powershell
cd backend
mvn clean compile
```

To run full verification including test assertions:
```powershell
mvn clean test
```

To package the application JAR:
```powershell
mvn clean package
```

### Step 4: Run the Backend

Run the Spring Boot application using:

```powershell
cd backend
mvn spring-boot:run
```

Or execute the packaged JAR:

```powershell
java -jar target/railway-user-management-0.0.1-SNAPSHOT.jar
```

The application will start on port `8080`.

---

## Stage 2 API Endpoints

### 1. Register Passenger
- **Endpoint:** `POST /api/auth/register` (Public)
- **Request Body:**
  ```json
  {
    "fullName": "Aarav Patel",
    "email": "aarav.patel@example.com",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "mobile": "9876543210"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Passenger registered successfully",
    "user_id": 1,
    "passenger_id": 1,
    "email": "aarav.patel@example.com",
    "role": "PASSENGER",
    "status": "ACTIVE"
  }
  ```

### 2. Login
- **Endpoint:** `POST /api/auth/login` (Public)
- **Request Body:**
  ```json
  {
    "email": "aarav.patel@example.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "user_id": 1,
    "email": "aarav.patel@example.com",
    "role": "PASSENGER",
    "status": "ACTIVE"
  }
  ```

### 3. Get Passenger Profile
- **Endpoint:** `GET /api/passengers/profile` (Protected - requires `Authorization: Bearer <token>`)
- **Response (200 OK):**
  ```json
  {
    "passenger_id": 1,
    "user_id": 1,
    "full_name": "Aarav Patel",
    "email": "aarav.patel@example.com",
    "mobile": "9876543210",
    "status": "ACTIVE",
    "created_at": "2026-10-08T09:36:54"
  }
  ```

### 4. Update Passenger Profile
- **Endpoint:** `PUT /api/passengers/profile` (Protected - requires `Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "full_name": "Aarav K. Patel",
    "mobile": "9123456789"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "passenger_id": 1,
    "user_id": 1,
    "full_name": "Aarav K. Patel",
    "email": "aarav.patel@example.com",
    "mobile": "9123456789",
    "status": "ACTIVE",
    "created_at": "2026-10-08T09:36:54"
  }
  ```

---

## Project Structure

```
Railway_login/
 ├── backend/
 │    ├── pom.xml
 │    ├── mvnw & mvnw.cmd
 │    └── src/
 │         ├── main/
 │         │    ├── java/
 │         │    │    └── com/railway/usermanagement/
 │         │    │         ├── RailwayUserManagementApplication.java
 │         │    │         ├── controller/
 │         │    │         │    ├── AuthController.java
 │         │    │         │    └── PassengerController.java
 │         │    │         ├── dto/
 │         │    │         │    ├── ErrorResponse.java
 │         │    │         │    ├── LoginRequest.java
 │         │    │         │    ├── LoginResponse.java
 │         │    │         │    ├── PassengerResponse.java
 │         │    │         │    ├── PassengerUpdateRequest.java
 │         │    │         │    ├── RegisterRequest.java
 │         │    │         │    └── RegisterResponse.java
 │         │    │         ├── entity/
 │         │    │         │    ├── User.java
 │         │    │         │    └── Passenger.java
 │         │    │         ├── exception/
 │         │    │         │    ├── EmailAlreadyExistsException.java
 │         │    │         │    ├── GlobalExceptionHandler.java
 │         │    │         │    ├── InvalidCredentialsException.java
 │         │    │         │    ├── PasswordMismatchException.java
 │         │    │         │    └── ResourceNotFoundException.java
 │         │    │         ├── repository/
 │         │    │         │    ├── UserRepository.java
 │         │    │         │    └── PassengerRepository.java
 │         │    │         ├── security/
 │         │    │         │    ├── CustomUserDetails.java
 │         │    │         │    ├── CustomUserDetailsService.java
 │         │    │         │    ├── JwtAuthenticationEntryPoint.java
 │         │    │         │    ├── JwtAuthenticationFilter.java
 │         │    │         │    ├── JwtService.java
 │         │    │         │    └── SecurityConfig.java
 │         │    │         └── service/
 │         │    │              ├── AuthService.java
 │         │    │              └── PassengerService.java
 │         │    └── resources/
 │         │         ├── application.properties
 │         │         └── schema.sql
 │         └── test/
 │              ├── java/
 │              │    └── com/railway/usermanagement/
 │              │         ├── AuthAndPassengerIntegrationTest.java
 │              │         └── RailwayUserManagementApplicationTests.java
 │              └── resources/
 │                   └── application.properties
 ├── .gitignore
 └── README.md
```
