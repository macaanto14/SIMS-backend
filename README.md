# School Information Management System (SIMS) Backend

A comprehensive Node.js + Express backend system for managing school operations with multi-tenancy support, role-based access control (RBAC), and Supabase PostgreSQL integration.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple schools with data isolation
- **Role-Based Access Control**: 8 distinct user roles with granular permissions
- **RESTful API**: Clean, consistent API design following REST principles
- **JWT Authentication**: Secure token-based authentication
- **Database Integration**: PostgreSQL with Supabase hosting
- **Input Validation**: Comprehensive request validation using express-validator
- **Security**: Helmet, CORS, rate limiting, and password hashing
- **Audit Trails**: Automatic timestamp tracking for all operations
- **Error Handling**: Centralized error handling with detailed logging

## 🏗️ Architecture

### User Roles
1. **Super Admin**: Full system access, manages schools and system settings
2. **Admin**: School-level administration, manages daily operations
3. **Teacher**: Manages classes, attendance, and student assessments
4. **Accountant**: Handles financial operations and fee management
5. **Student**: Views personal academic information
6. **Parent**: Monitors child's progress and receives notifications
7. **Receptionist**: Manages registrations and public inquiries
8. **Librarian**: Manages library operations and book transactions

### Core Modules
- **Authentication & Authorization**
- **User & Role Management**
- **School & Tenant Management**
- **Academic Management** (Years, Terms, Classes, Subjects)
- **Attendance Tracking**
- **Grading System**
- **Financial Management** (Fees, Payments, Expenses)
- **Library Management**
- **Communication System** (Notifications, Announcements)

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase hosted)
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Database Client**: pg (node-postgres)

## 📦 Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Environment Setup**:
Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

Required environment variables:
```env
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=12
```

3. **Database Setup**:
Run the database migrations in your Supabase project to create the required schema.

4. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### User Management

#### Get Users
```http
GET /api/users?page=1&limit=20&role=teacher&school_id=uuid&search=john
Authorization: Bearer <jwt_token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <jwt_token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "first_name": "Updated Name",
  "phone": "+1234567890"
}
```

### School Management

#### Get Schools
```http
GET /api/schools?page=1&limit=20&search=school
Authorization: Bearer <jwt_token>
```

#### Create School (Super Admin only)
```http
POST /api/schools
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Example School",
  "code": "EXS001",
  "address": "123 School Street",
  "phone": "+1234567890",
  "email": "info@exampleschool.com"
}
```

### Academic Management

#### Get Academic Years
```http
GET /api/academic-years?school_id=uuid&page=1&limit=20
Authorization: Bearer <jwt_token>
```

#### Create Academic Year
```http
POST /api/academic-years
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "school_id": "uuid",
  "name": "2024-2025",
  "start_date": "2024-09-01",
  "end_date": "2025-06-30",
  "is_current": true
}
```

#### Get Classes
```http
GET /api/classes?school_id=uuid&academic_year_id=uuid&page=1&limit=20
Authorization: Bearer <jwt_token>
```

#### Mark Attendance
```http
POST /api/attendance
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "student_id": "uuid",
  "class_id": "uuid",
  "date": "2024-01-15",
  "status": "present",
  "notes": "Optional notes"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Configurable request rate limiting
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: Security headers and protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **Role-Based Access**: Granular permission system

## 🏃‍♂️ Development

### Available Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests (placeholder)

### Project Structure
```
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── schoolController.js  # School management
│   └── academicController.js # Academic operations
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User routes
│   ├── schools.js         # School routes
│   └── academic.js        # Academic routes
├── utils/
│   └── helpers.js         # Utility functions
├── server.js              # Main application file
└── README.md
```

## 🚀 Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure PostgreSQL database is accessible
3. **SSL**: Configure SSL certificates for production
4. **Process Manager**: Use PM2 or similar for process management
5. **Reverse Proxy**: Configure nginx or similar for load balancing

## 📊 Health Check

The API includes a health check endpoint:
```http
GET /health
```

Returns system status, uptime, and database connectivity.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs for debugging information

---

Built with ❤️ for modern school management systems.


## Key Features:
### Login Flow:
1. 1.
   User enters email/password
2. 2.
   System returns available roles if user has multiple roles
3. 3.
   User selects desired role
4. 4.
   System returns JWT token with role-specific permissions
5. 5.
   Frontend can display role-appropriate interface
### Permission System:
- Each role has specific module permissions (create, read, update, delete)
- Permissions are cached for performance
- Real-time permission checking
- School-context aware permissions
### Security Features:
- Rate limiting on authentication endpoints
- Password strength validation
- Account lockout protection
- Audit logging for all authentication events
- JWT token with role information
## 📱 Frontend Deployment Ready:
The documentation includes:

- Complete endpoint specifications
- Request/response examples
- Error handling guidelines
- Authentication flow implementation
- Role-based UI component examples
- WebSocket integration for real-time updates