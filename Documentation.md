
## Support & Maintenance

### Common Issues
1. **Database Connection**: Check DATABASE_URL and network connectivity
2. **JWT Errors**: Verify JWT_SECRET and token expiration
3. **CORS Issues**: Check ALLOWED_ORIGINS configuration
4. **Rate Limiting**: Adjust rate limit settings if needed

### Performance Optimization
- Use database indexes for frequently queried fields
- Implement caching for static data
- Optimize database queries
- Use connection pooling
- Implement pagination for large datasets

### Security Best Practices
- Regularly update dependencies
- Use HTTPS in production
- Implement proper input validation
- Use parameterized queries
- Regular security audits
- Monitor for suspicious activities

---

**Built with ❤️ for modern school management systems.**

**Version**: 2.0.0  
**Last Updated**: January 2024  
**License**: MIT



### Available Scripts
```bash
# Development
npm run dev                     # Start development server with nodemon
npm start                       # Start production server

# Database
npm run migrate                 # Run database migrations
npm run seed                    # Seed initial data

# Testing
npm test                        # Run tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage

# Code Quality
npm run lint                    # Run ESLint
npm run lint:fix               # Fix ESLint issues

# Documentation
npm run docs:generate          # Generate API documentation
npm run docs:serve             # Serve documentation
npm run docs:build             # Build documentation

# Email & SMS
npm run email:setup            # Setup email system
npm run email:test             # Test email functionality
npm run sms:setup              # Setup SMS system
npm run sms:test               # Test SMS functionality
```

### Environment Variables
```env
# Required Variables
DATABASE_URL=                   # PostgreSQL connection string
JWT_SECRET=                     # JWT signing secret
SUPABASE_URL=                   # Supabase project URL
SUPABASE_ANON_KEY=             # Supabase anonymous key

# Optional Variables
PORT=3000                       # Server port
NODE_ENV=development           # Environment
BCRYPT_ROUNDS=12               # Password hashing rounds
RATE_LIMIT_WINDOW_MS=900000    # Rate limit window
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
```

### Database Migrations
```bash
# Create new migration
node scripts/create-migration.js "migration_name"

# Run migrations
npm run migrate

# Rollback migration
node scripts/rollback-migration.js
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=auth

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Health checks enabled
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sims
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Health Check Endpoint
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0",
  "environment": "production",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

### Logging Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Metrics & Monitoring
- **Response Time**: Track API response times
- **Error Rate**: Monitor error rates by endpoint
- **Database Performance**: Track query execution times
- **Memory Usage**: Monitor memory consumption
- **CPU Usage**: Track CPU utilization
- **Active Connections**: Monitor database connections

### Alerting
- **High Error Rate**: Alert when error rate exceeds threshold
- **Slow Response Time**: Alert when response time is too high
- **Database Issues**: Alert on database connection failures
- **Memory/CPU**: Alert on resource exhaustion

## API Documentation Access

### Swagger UI


SIMS-backend/
├── config/
│   ├── database.js              # Database configuration
│   └── swagger.js               # Swagger configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User management
│   ├── schoolController.js      # School management
│   ├── academicController.js    # Academic operations
│   ├── emailController.js       # Email services
│   └── smsController.js         # SMS services
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   ├── rbac.js                  # Role-based access control
│   ├── validation.js            # Input validation
│   ├── audit/                   # Audit logging
│   └── errorHandler.js          # Error handling
├── routes/
│   ├── v1/
│   │   ├── index.js            # Main router
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User routes
│   │   ├── schools.js          # School routes
│   │   ├── academic.js         # Academic routes
│   │   ├── students.js         # Student routes
│   │   ├── attendance.js       # Attendance routes
│   │   ├── grades.js           # Grade routes
│   │   ├── finance.js          # Financial routes
│   │   ├── library.js          # Library routes
│   │   └── reports.js          # Reports routes
├── utils/
│   ├── helpers.js              # Utility functions
│   ├── logger.js               # Logging configuration
│   ├── email.js                # Email utilities
│   └── sms.js                  # SMS utilities
├── scripts/
│   ├── setup-rbac-tables.js    # RBAC setup
│   ├── create-super-admin.js   # Super admin creation
│   ├── migrate.js              # Database migrations
│   └── seed.js                 # Data seeding
├── docs/
│   ├── api/                    # API documentation
│   └── README.md               # Documentation index
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data
├── supabase/
│   └── migrations/             # Database migrations
├── server.js                   # Application entry point
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation



### Authentication Endpoints

#### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "schoolId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token",
    "expiresIn": 86400
  }
}
```

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### 3. Get Available Roles
```http
GET /api/auth/roles
Authorization: Bearer <token>
```

#### 4. Role-Based Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "selectedRole": "Teacher",
  "schoolId": "uuid"
}
```

#### 5. Switch Role
```http
POST /api/auth/switch-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "selectedRole": "Admin",
  "schoolId": "uuid"
}
```

### User Management Endpoints

#### 1. Get All Users
```http
GET /api/users?page=1&limit=20&role=teacher&school_id=uuid&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `role`: Filter by role name
- `school_id`: Filter by school
- `search`: Search in name or email
- `is_active`: Filter by active status

#### 2. Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### 3. Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name",
  "phone": "+1234567890",
  "isActive": true
}
```

#### 4. Assign Role to User
```http
POST /api/users/:id/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "uuid",
  "schoolId": "uuid",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### School Management Endpoints

#### 1. Get All Schools
```http
GET /api/schools?page=1&limit=20&search=school&is_active=true
Authorization: Bearer <token>
```

#### 2. Get School by ID
```http
GET /api/schools/:id
Authorization: Bearer <token>
```

#### 3. Create School (Super Admin only)
```http
POST /api/schools
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Example School",
  "code": "EXS001",
  "address": "123 School Street",
  "phone": "+1234567890",
  "email": "info@exampleschool.com",
  "website": "https://exampleschool.com",
  "principalId": "uuid"
}
```

#### 4. Update School
```http
PUT /api/schools/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated School Name",
  "address": "Updated Address",
  "phone": "+1234567890",
  "settings": {
    "timezone": "UTC",
    "academic_year_start": "September"
  }
}
```

### Academic Management Endpoints

#### Academic Years

##### 1. Get Academic Years
```http
GET /api/academic/academic-years?school_id=uuid&page=1&limit=20
Authorization: Bearer <token>
```

##### 2. Create Academic Year
```http
POST /api/academic/academic-years
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolId": "uuid",
  "name": "2024-2025",
  "startDate": "2024-09-01",
  "endDate": "2025-06-30",
  "isCurrent": true
}
```

#### Classes

##### 1. Get Classes
```http
GET /api/academic/classes?school_id=uuid&academic_year_id=uuid&page=1&limit=20
Authorization: Bearer <token>
```

##### 2. Create Class
```http
POST /api/academic/classes
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolId": "uuid",
  "academicYearId": "uuid",
  "name": "Grade 10-A",
  "gradeLevel": 10,
  "section": "A",
  "classTeacherId": "uuid",
  "maxStudents": 30,
  "roomNumber": "101"
}
```

#### Subjects

##### 1. Get Subjects
```http
GET /api/academic/subjects?school_id=uuid&page=1&limit=20
Authorization: Bearer <token>
```

##### 2. Create Subject
```http
POST /api/academic/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolId": "uuid",
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Advanced Mathematics"
}
```

### Student Management Endpoints

#### 1. Get Students
```http
GET /api/students?school_id=uuid&class_id=uuid&page=1&limit=20&search=john
Authorization: Bearer <token>
```

#### 2. Create Student Profile
```http
POST /api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "uuid",
  "studentId": "STU001",
  "admissionNumber": "ADM2024001",
  "admissionDate": "2024-01-15",
  "classId": "uuid",
  "dateOfBirth": "2010-05-15",
  "gender": "Male",
  "bloodGroup": "O+",
  "address": "Student address",
  "parentContact": "+1234567890",
  "emergencyContact": "+0987654321"
}
```

#### 3. Enroll Student in Class
```http
POST /api/students/:id/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "uuid",
  "academicYearId": "uuid",
  "enrollmentDate": "2024-01-15"
}
```

### Attendance Management Endpoints

#### 1. Mark Attendance
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "uuid",
  "classId": "uuid",
  "date": "2024-01-15",
  "status": "present",
  "notes": "Optional notes"
}
```

#### 2. Get Attendance Records
```http
GET /api/attendance?class_id=uuid&date_from=2024-01-01&date_to=2024-01-31&student_id=uuid
Authorization: Bearer <token>
```

#### 3. Bulk Mark Attendance
```http
POST /api/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "uuid",
  "date": "2024-01-15",
  "attendanceRecords": [
    {
      "studentId": "uuid1",
      "status": "present"
    },
    {
      "studentId": "uuid2",
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}
```

### Grade Management Endpoints

#### 1. Add Grade
```http
POST /api/grades
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "uuid",
  "subjectId": "uuid",
  "termId": "uuid",
  "assessmentType": "exam",
  "maxMarks": 100,
  "marksObtained": 85,
  "grade": "A",
  "remarks": "Excellent performance"
}
```

#### 2. Get Student Grades
```http
GET /api/grades?student_id=uuid&term_id=uuid&subject_id=uuid
Authorization: Bearer <token>
```

#### 3. Generate Report Card
```http
GET /api/grades/report-card/:student_id?term_id=uuid
Authorization: Bearer <token>
```

### Financial Management Endpoints

#### 1. Create Fee Structure
```http
POST /api/finance/fee-structures
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolId": "uuid",
  "academicYearId": "uuid",
  "name": "Tuition Fee",
  "amount": 5000,
  "dueDate": "2024-04-30",
  "applicableClasses": ["uuid1", "uuid2"]
}
```

#### 2. Collect Fee Payment
```http
POST /api/finance/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "uuid",
  "feeStructureId": "uuid",
  "amountPaid": 5000,
  "paymentMethod": "cash",
  "transactionId": "TXN123456",
  "paymentDate": "2024-01-15"
}
```

#### 3. Get Payment History
```http
GET /api/finance/payments?student_id=uuid&date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <token>
```

### Library Management Endpoints

#### 1. Add Book
```http
POST /api/library/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolId": "uuid",
  "title": "Advanced Mathematics",
  "author": "John Smith",
  "isbn": "978-1234567890",
  "category": "Mathematics",
  "totalCopies": 10,
  "availableCopies": 10
}
```

#### 2. Issue Book
```http
POST /api/library/issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "uuid",
  "studentId": "uuid",
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15"
}
```

#### 3. Return Book
```http
PUT /api/library/issues/:id/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnDate": "2024-02-10",
  "condition": "good",
  "fineAmount": 0
}
```

### Communication Endpoints

#### 1. Send Notification
```http
POST /api/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Important Announcement",
  "message": "School will be closed tomorrow due to weather conditions.",
  "type": "announcement",
  "recipients": ["uuid1", "uuid2"],
  "schoolId": "uuid",
  "priority": "high"
}
```

#### 2. Send Email
```http
POST /api/email/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": ["parent@example.com"],
  "subject": "Student Progress Report",
  "template": "progress_report",
  "data": {
    "studentName": "John Doe",
    "grade": "A",
    "subject": "Mathematics"
  }
}
```

#### 3. Send SMS
```http
POST /api/sms/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": ["+1234567890"],
  "message": "Your child John Doe was absent today. Please contact the school if this is an error.",
  "type": "attendance_alert"
}
```

### Reports Endpoints

#### 1. Attendance Report
```http
GET /api/reports/attendance?class_id=uuid&date_from=2024-01-01&date_to=2024-01-31&format=pdf
Authorization: Bearer <token>
```

#### 2. Academic Performance Report
```http
GET /api/reports/academic-performance?student_id=uuid&term_id=uuid&format=pdf
Authorization: Bearer <token>
```

#### 3. Financial Report
```http
GET /api/reports/financial?school_id=uuid&date_from=2024-01-01&date_to=2024-12-31&type=fee_collection
Authorization: Bearer <token>
```

### Audit Endpoints

#### 1. Get Audit Logs
```http
GET /api/audit/logs?page=1&limit=20&user_id=uuid&action=create&date_from=2024-01-01
Authorization: Bearer <token>
```

#### 2. Get User Activity
```http
GET /api/audit/user-activity/:user_id?date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <token>
```

## Security Features

### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
```

### CORS Configuration
```javascript
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  }
  return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
```

### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateUserRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone()
];
```

### Password Security
```javascript
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/auth/register"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (business logic errors)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Error Types
```javascript
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};
```

## Development Guide

### Project Structure



## Technology Stack

### Core Technologies
- **Runtime**: Node.js (≥18.0.0)
- **Framework**: Express.js 4.21.2
- **Database**: PostgreSQL (Supabase hosted)
- **Authentication**: JWT + bcryptjs
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI 3.0

### Security & Middleware
- **Security**: Helmet.js, CORS, express-rate-limit
- **Logging**: Winston, Morgan
- **Compression**: compression middleware
- **Database Client**: pg (node-postgres)

### Communication Services
- **Email**: Nodemailer with Handlebars templates
- **SMS**: Twilio integration
- **Phone Validation**: libphonenumber-js

### Development Tools
- **Testing**: Jest, Supertest
- **Linting**: ESLint, Prettier
- **Process Management**: Nodemon (development)
- **API Testing**: Newman (Postman CLI)

## Installation & Setup

### Prerequisites
- Node.js ≥18.0.0
- npm ≥8.0.0
- PostgreSQL database (Supabase recommended)
- Redis (for rate limiting and caching)

### Environment Configuration
Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@sims.edu

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Installation Steps

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd SIMS-backend
npm install
```

2. **Database Setup**
```bash
# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Setup RBAC tables
node scripts/setup-rbac-tables.js

# Create super admin user
node scripts/create-super-admin.js
```

3. **Start the Server**
```bash
# Development mode
npm run dev

# Production mode
npm start

# With documentation generation
npm run docs:serve
```

## Database Schema

### Core RBAC Tables

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Roles Table
```sql
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### User Roles Mapping
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  school_id uuid REFERENCES schools(id),
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id, school_id)
);
```

### School Management Tables

#### Schools Table
```sql
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  principal_id uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Academic Years Table
```sql
CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Extended User Profile Tables

#### Student Profiles
```sql
CREATE TABLE student_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  student_id text UNIQUE NOT NULL,
  admission_number text UNIQUE NOT NULL,
  admission_date date NOT NULL,
  date_of_birth date NOT NULL,
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group text,
  address text,
  parent_contact text,
  emergency_contact text,
  medical_conditions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": [
    {
      "roleId": "uuid",
      "roleName": "Teacher",
      "schoolId": "uuid"
    }
  ],
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Permissions

#### Super Admin
- Full system access
- Manage all schools
- System configuration
- User role assignments

#### Admin (School Level)
- School management
- User management within school
- Academic year setup
- Financial oversight

#### Teacher
- Class management
- Attendance marking
- Grade entry
- Student progress tracking

#### Student
- View personal academic records
- Access assignments
- View attendance
- Check grades

#### Parent
- View child's academic progress
- Receive notifications
- Communication with teachers
- Fee payment status

#### Receptionist
- Student admissions
- Visitor management
- General inquiries
- Basic data entry

#### Librarian
- Library catalog management
- Book issue/return
- Library reports
- Inventory management

#### Accountant
- Fee management
- Payment processing
- Financial reports
- Expense tracking

### Authentication Middleware

```javascript
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user details and roles from database
    req.user = await getUserWithRoles(decoded.userId);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

## API Endpoints

### Base URL


Super Admin (Platform-wide access)
│
├── Admin (School-level administration)
│   ├── Teacher (Academic management)
│   ├── Accountant (Financial management)
│   ├── Receptionist (Front desk operations)
│   └── Librarian (Library management)
│
├── Student (Personal academic data)
└── Parent (Child's academic progress)


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│
▼
┌─────────────────┐
│   External      │
│   Services      │
│   (Email/SMS)   │
└─────────────────┘