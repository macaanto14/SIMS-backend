
## User Roles

The system supports eight distinct user roles with specific permissions:

### 1. Super Admin
- **Description**: Platform-wide access with full system control
- **Permissions**: All system operations, school management, user management
- **Access Level**: Global

### 2. Admin
- **Description**: School administrator with comprehensive school-level access
- **Permissions**: School operations, user management within school, academic management
- **Access Level**: School-specific

### 3. Teacher
- **Description**: Manages classes, grades, attendance, and academic content
- **Permissions**: Student management, attendance marking, grade management, class management
- **Access Level**: Class/Subject-specific

### 4. Student
- **Description**: Access to personal academic information and school resources
- **Permissions**: View own grades, attendance, assignments, library records
- **Access Level**: Personal data only

### 5. Parent
- **Description**: Monitor child's academic progress and school communications
- **Permissions**: View child's grades, attendance, fees, school communications
- **Access Level**: Child-specific data

### 6. Receptionist
- **Description**: Front desk operations, student admissions, and inquiries
- **Permissions**: Student enrollment, visitor management, basic student information
- **Access Level**: School-specific (limited)

### 7. Librarian
- **Description**: Library management and book circulation
- **Permissions**: Library catalog management, book issues/returns, library reports
- **Access Level**: Library-specific

### 8. Accountant
- **Description**: Financial management and fee collection
- **Permissions**: Fee management, payment processing, financial reports
- **Access Level**: Financial data

---

## API Endpoints

### Authentication Endpoints

#### 1. Get Available Roles
```http
GET /api/auth/roles
```

**Description**: Retrieves all available user roles for login selection

**Response**:
```json
{
  "success": true,
  "message": "Available roles retrieved successfully",
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "Super Admin",
        "description": "Full system access with ability to manage all schools, users, and system settings",
        "isSystemRole": true
      },
      {
        "id": "uuid",
        "name": "Teacher",
        "description": "Manages classes, grades, attendance, and lesson materials for assigned subjects",
        "isSystemRole": true
      }
    ]
  }
}
```

#### 2. Enhanced Login with Role Selection
```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@school.com",
  "password": "SecurePass123!",
  "selectedRole": "Teacher",
  "schoolId": "uuid" // Optional, required for school-specific roles
}
```

**Response (Role Selection Required)**:
```json
{
  "success": true,
  "message": "Please select a role to continue",
  "data": {
    "requiresRoleSelection": true,
    "user": {
      "id": "uuid",
      "email": "user@school.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "availableRoles": [
      {
        "roleId": "uuid",
        "roleName": "Teacher",
        "roleDescription": "Manages classes and students",
        "schoolId": "uuid",
        "schoolName": "ABC School"
      }
    ]
  }
}
```

**Response (Login Successful)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@school.com",
      "firstName": "John",
      "lastName": "Doe",
      "selectedRole": {
        "roleId": "uuid",
        "roleName": "Teacher",
        "schoolId": "uuid",
        "schoolName": "ABC School"
      },
      "allRoles": []
    },
    "token": "jwt-token",
    "permissions": {
      "students": [
        {"action": "read", "description": "View student information"},
        {"action": "update", "description": "Update student information"}
      ],
      "attendance": [
        {"action": "create", "description": "Mark attendance"},
        {"action": "read", "description": "View attendance records"}
      ]
    }
  }
}
```

#### 3. Switch Role
```http
POST /api/auth/switch-role
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "selectedRole": "Admin",
  "schoolId": "uuid"
}
```

#### 4. Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 5. Register User
```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "newuser@school.com",
  "password": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "school_id": "uuid",
  "initial_role": "Teacher"
}
```

---

### User Management Endpoints

#### 1. Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `role`: Filter by role
- `school_id`: Filter by school

#### 2. Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin, or own profile

#### 3. Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin, or own profile

#### 4. Deactivate User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin

#### 5. Assign Role to User
```http
POST /api/users/:id/roles
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin

**Request Body**:
```json
{
  "roleId": "uuid",
  "schoolId": "uuid"
}
```

---

### School Management Endpoints

#### 1. Get All Schools
```http
GET /api/schools
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin

#### 2. Create School
```http
POST /api/schools
Authorization: Bearer <token>
```
**Required Role**: Super Admin

**Request Body**:
```json
{
  "name": "ABC International School",
  "address": "123 Education Street",
  "phone": "+1234567890",
  "email": "info@abcschool.com",
  "website": "https://abcschool.com",
  "principal_name": "Dr. John Smith",
  "established_year": 2010,
  "school_type": "Private",
  "curriculum": "International Baccalaureate"
}
```

#### 3. Update School
```http
PUT /api/schools/:id
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin (for own school)

#### 4. Get School Details
```http
GET /api/schools/:id
Authorization: Bearer <token>
```

---

### Student Management Endpoints

#### 1. Get All Students
```http
GET /api/students
Authorization: Bearer <token>
```
**Required Role**: Admin, Teacher, Receptionist

**Query Parameters**:
- `class_id`: Filter by class
- `academic_year_id`: Filter by academic year
- `search`: Search by name or student ID

#### 2. Create Student Profile
```http
POST /api/students
Authorization: Bearer <token>
```
**Required Role**: Admin, Receptionist

**Request Body**:
```json
{
  "user_id": "uuid",
  "student_id": "STU001",
  "admission_number": "ADM2024001",
  "admission_date": "2024-01-15",
  "class_id": "uuid",
  "date_of_birth": "2010-05-15",
  "gender": "Male",
  "blood_group": "O+",
  "address": "Student address",
  "parent_contact": "+1234567890",
  "emergency_contact": "+0987654321",
  "medical_conditions": "None"
}
```

#### 3. Update Student Profile
```http
PUT /api/students/:id
Authorization: Bearer <token>
```
**Required Role**: Admin, Teacher, Receptionist

#### 4. Get Student Details
```http
GET /api/students/:id
Authorization: Bearer <token>
```
**Required Role**: Admin, Teacher, Parent (for own child), Student (own profile)

#### 5. Enroll Student in Class
```http
POST /api/students/:id/enroll
Authorization: Bearer <token>
```
**Required Role**: Admin, Receptionist

---

### Teacher Management Endpoints

#### 1. Get All Teachers
```http
GET /api/teachers
Authorization: Bearer <token>
```
**Required Role**: Admin

#### 2. Create Teacher Profile
```http
POST /api/teachers
Authorization: Bearer <token>
```
**Required Role**: Admin

#### 3. Assign Teacher to Class
```http
POST /api/teachers/:id/assign-class
Authorization: Bearer <token>
```
**Required Role**: Admin

---

### Academic Management Endpoints

#### 1. Academic Years

##### Get Academic Years
```http
GET /api/academic/academic-years
Authorization: Bearer <token>
```

##### Create Academic Year
```http
POST /api/academic/academic-years
Authorization: Bearer <token>
```
**Required Role**: Super Admin, Admin

#### 2. Classes

##### Get Classes
```http
GET /api/academic/classes
Authorization: Bearer <token>
```

##### Create Class
```http
POST /api/academic/classes
Authorization: Bearer <token>
```
**Required Role**: Admin

#### 3. Subjects

##### Get Subjects
```http
GET /api/academic/subjects
Authorization: Bearer <token>
```

##### Create Subject
```http
POST /api/academic/subjects
Authorization: Bearer <token>
```
**Required Role**: Admin

---

### Attendance Management Endpoints

#### 1. Mark Attendance
```http
POST /api/attendance
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin

**Request Body**:
```json
{
  "class_id": "uuid",
  "date": "2024-01-15",
  "attendance_records": [
    {
      "student_id": "uuid",
      "status": "present",
      "notes": "On time"
    },
    {
      "student_id": "uuid",
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}
```

#### 2. Get Attendance Records
```http
GET /api/attendance
Authorization: Bearer <token>
```

**Query Parameters**:
- `class_id`: Filter by class
- `student_id`: Filter by student
- `date_from`: Start date
- `date_to`: End date

#### 3. Update Attendance
```http
PUT /api/attendance/:id
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin

---

### Grade Management Endpoints

#### 1. Add Grades
```http
POST /api/grades
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin

**Request Body**:
```json
{
  "student_id": "uuid",
  "subject_id": "uuid",
  "assessment_type": "Quiz",
  "assessment_name": "Math Quiz 1",
  "marks_obtained": 85,
  "total_marks": 100,
  "assessment_date": "2024-01-15",
  "remarks": "Good performance"
}
```

#### 2. Get Grades
```http
GET /api/grades
Authorization: Bearer <token>
```

**Query Parameters**:
- `student_id`: Filter by student
- `subject_id`: Filter by subject
- `class_id`: Filter by class
- `assessment_type`: Filter by assessment type

#### 3. Update Grade
```http
PUT /api/grades/:id
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin

---

### Financial Management Endpoints

#### 1. Fee Structures

##### Get Fee Structures
```http
GET /api/finance/fee-structures
Authorization: Bearer <token>
```
**Required Role**: Admin, Accountant

##### Create Fee Structure
```http
POST /api/finance/fee-structures
Authorization: Bearer <token>
```
**Required Role**: Admin, Accountant

#### 2. Student Fees

##### Get Student Fees
```http
GET /api/finance/student-fees
Authorization: Bearer <token>
```

##### Assign Fees to Student
```http
POST /api/finance/student-fees
Authorization: Bearer <token>
```
**Required Role**: Admin, Accountant

#### 3. Fee Payments

##### Record Payment
```http
POST /api/finance/payments
Authorization: Bearer <token>
```
**Required Role**: Accountant, Admin

**Request Body**:
```json
{
  "student_fee_id": "uuid",
  "amount_paid": 1000.00,
  "payment_method": "Cash",
  "payment_date": "2024-01-15",
  "transaction_reference": "TXN123456",
  "notes": "Full payment for tuition fee"
}
```

##### Get Payment History
```http
GET /api/finance/payments
Authorization: Bearer <token>
```

---

### Library Management Endpoints

#### 1. Books

##### Get Books
```http
GET /api/library/books
Authorization: Bearer <token>
```

##### Add Book
```http
POST /api/library/books
Authorization: Bearer <token>
```
**Required Role**: Librarian, Admin

#### 2. Book Issues

##### Issue Book
```http
POST /api/library/issues
Authorization: Bearer <token>
```
**Required Role**: Librarian

**Request Body**:
```json
{
  "book_id": "uuid",
  "user_id": "uuid",
  "issue_date": "2024-01-15",
  "due_date": "2024-01-29",
  "notes": "Handle with care"
}
```

##### Return Book
```http
PUT /api/library/issues/:id/return
Authorization: Bearer <token>
```
**Required Role**: Librarian

##### Get Issue History
```http
GET /api/library/issues
Authorization: Bearer <token>
```

---

### Communication Endpoints

#### 1. Announcements

##### Get Announcements
```http
GET /api/communications/announcements
Authorization: Bearer <token>
```

##### Create Announcement
```http
POST /api/communications/announcements
Authorization: Bearer <token>
```
**Required Role**: Admin, Teacher

**Request Body**:
```json
{
  "title": "Important Notice",
  "content": "School will be closed tomorrow due to maintenance.",
  "target_audience": "all",
  "priority": "high",
  "expires_at": "2024-01-20T23:59:59Z"
}
```

#### 2. Notifications

##### Get Notifications
```http
GET /api/communications/notifications
Authorization: Bearer <token>
```

##### Mark Notification as Read
```http
PUT /api/communications/notifications/:id/read
Authorization: Bearer <token>
```

---

### Reports Endpoints

#### 1. Academic Reports

##### Student Progress Report
```http
GET /api/reports/student-progress/:student_id
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin, Parent (for own child)

##### Class Performance Report
```http
GET /api/reports/class-performance/:class_id
Authorization: Bearer <token>
```
**Required Role**: Teacher, Admin

#### 2. Attendance Reports

##### Attendance Summary
```http
GET /api/reports/attendance-summary
Authorization: Bearer <token>
```

**Query Parameters**:
- `class_id`: Filter by class
- `date_from`: Start date
- `date_to`: End date

#### 3. Financial Reports

##### Fee Collection Report
```http
GET /api/reports/fee-collection
Authorization: Bearer <token>
```
**Required Role**: Accountant, Admin

##### Outstanding Fees Report
```http
GET /api/reports/outstanding-fees
Authorization: Bearer <token>
```
**Required Role**: Accountant, Admin

---

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_RESOURCE`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

API endpoints are protected by rate limiting:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per hour
- **Admin endpoints**: 200 requests per hour
- **Super Admin endpoints**: Unlimited

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## WebSocket Events

Real-time updates are available via WebSocket connection:

### Connection
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### 1. Attendance Updates
```javascript
socket.on('attendance:updated', (data) => {
  // Handle attendance update
});
```

#### 2. Grade Updates
```javascript
socket.on('grade:added', (data) => {
  // Handle new grade
});
```

#### 3. Announcements
```javascript
socket.on('announcement:new', (data) => {
  // Handle new announcement
});
```

#### 4. Fee Payments
```javascript
socket.on('payment:received', (data) => {
  // Handle payment notification
});
```

---

## Frontend Integration Guide

### 1. Authentication Flow

```javascript
// 1. Get available roles
const roles = await fetch('/api/auth/roles').then(r => r.json());

// 2. Login with credentials
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@school.com',
    password: 'password'
  })
});

const loginData = await loginResponse.json();

// 3. If role selection required
if (loginData.data.requiresRoleSelection) {
  // Show role selection UI
  const selectedRole = await showRoleSelection(loginData.data.availableRoles);
  
  // Login with selected role
  const finalLogin = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@school.com',
      password: 'password',
      selectedRole: selectedRole.roleName,
      schoolId: selectedRole.schoolId
    })
  });
}

// 4. Store token and user data
localStorage.setItem('token', loginData.data.token);
localStorage.setItem('user', JSON.stringify(loginData.data.user));
```

### 2. Role-Based UI Components

```javascript
// Check user permissions
const hasPermission = (module, action) => {
  const permissions = JSON.parse(localStorage.getItem('permissions'));
  return permissions[module]?.some(p => p.action === action);
};

// Conditional rendering
const StudentManagement = () => {
  if (!hasPermission('students', 'read')) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <StudentList />
      {hasPermission('students', 'create') && <AddStudentButton />}
      {hasPermission('students', 'update') && <EditStudentButton />}
    </div>
  );
};
```

### 3. API Client Setup

```javascript
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Handle token expiration
      this.handleAuthError();
    }
    
    return response.json();
  }
  
  // Specific methods for each module
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students?${query}`);
  }
  
  async markAttendance(data) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

---

## Testing

### 1. Authentication Testing

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"password"}'

# Test with role selection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"password","selectedRole":"Teacher","schoolId":"uuid"}'
```

### 2. Protected Endpoint Testing

```bash
# Test protected endpoint
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Deployment Considerations

### 1. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sims_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Production Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Setup initial roles and permissions
npm run setup:rbac

# Create super admin
npm run create:superadmin

# Start production server
npm start
```

---

This comprehensive documentation provides everything needed to integrate with the SIMS Backend API, including role-based authentication, all available endpoints, and frontend integration examples.


Development: http://localhost:3000/api Production: https://your-domain.com/api