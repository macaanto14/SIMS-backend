## Complete Backend API Services
### 1. Authentication APIs (/api/auth)
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile (requires authentication)
### 2. User Management APIs (/api/users)
- GET /api/users - Get all users (with pagination, requires Super Admin/Admin role)
- PUT /api/users/:id - Update user by ID (requires authentication)
- DELETE /api/users/:id - Deactivate user (requires Super Admin/Admin role)
### 3. School Management APIs (/api/schools)
- GET /api/schools - Get all schools (with pagination, requires authentication)
- POST /api/schools - Create new school (requires Super Admin role)
- PUT /api/schools/:id - Update school by ID (requires Super Admin/Admin role)
### 4. Academic Management APIs (/api/academic)
- Academic Years:
  
  - GET /api/academic/academic-years - Get academic years (with pagination)
  - POST /api/academic/academic-years - Create academic year (requires Super Admin/Admin role)
- Classes:
  
  - GET /api/academic/classes - Get classes (with pagination)
  - POST /api/academic/classes - Create class (requires Super Admin/Admin role)
- Attendance:
  
  - GET /api/academic/attendance - Get attendance records (with pagination)
  - POST /api/academic/attendance - Mark attendance (requires Super Admin/Admin/Teacher role)
### 5. Audit & Monitoring APIs (/api/audit)
- GET /api/audit/logs - Get audit logs with filtering and pagination (requires Super Admin/Admin/Principal role)
- GET /api/audit/logs/:id - Get specific audit log details (requires Super Admin/Admin/Principal role)
- GET /api/audit/user-activity - Get user activity summary (requires Super Admin/Admin/Principal role)
- GET /api/audit/dashboard - Get system activity dashboard (requires Super Admin/Admin/Principal role)
- GET /api/audit/export - Export audit logs in CSV/JSON format (requires Super Admin/Admin role)
### 6. Email Notification APIs (/api/email)
- POST /api/email/system-notification - Send system notification email
- POST /api/email/school-creation-confirmation - Send school creation confirmation
- POST /api/email/user-registration-confirmation - Send user registration confirmation
- POST /api/email/password-reset - Send password reset email
- POST /api/email/audit-alert - Send audit alert email
- POST /api/email/bulk-notification - Send bulk notification emails
- GET /api/email/stats - Get email statistics
- POST /api/email/test - Test email configuration
## Authentication & Authorization Requirements
Most endpoints require:

- Authentication : Bearer token in Authorization header
- Role-based Access : Different endpoints require different roles:
  - Super Admin : Full access to all endpoints
  - Admin : Access to most management functions
  - Principal : Access to school-specific data and audit logs
  - Teacher : Limited access (mainly attendance marking)
## Common Query Parameters
Many endpoints support:

- Pagination : page , limit
- Filtering : Various filters based on entity type
- Search : Text-based search capabilities
- Date Ranges : start_date , end_date for time-based filtering