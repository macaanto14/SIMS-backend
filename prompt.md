Build a complete React TypeScript frontend application for a School Information Management System (SIMS) that integrates with a comprehensive backend API. The system should support multi-tenant architecture with role-based access control and provide interfaces for all educational management needs.

### Technology Stack Requirements
- Framework : React 18+ with TypeScript
- Styling : Tailwind CSS for responsive design
- Routing : React Router v6 for navigation
- State Management : React Context API for authentication and global state
- HTTP Client : Axios for API communication
- Icons : Lucide React for consistent iconography
- Build Tool : Vite for fast development and building
### Authentication & Authorization System User Roles Hierarchy
```
enum UserRole {
  SUPER_ADMIN = 
  'super_admin',      // 
  Platform-wide access
  ADMIN = 
  'admin',                  // 
  School-wide management
  PRINCIPAL = 
  'principal',          // School 
  leadership
  TEACHER = 
  'teacher',              // 
  Classroom management
  STUDENT = 
  'student',              // 
  Student portal access
  PARENT = 
  'parent'                 // 
  Parent portal access
}
``` Permission-Based Access Control
Implement granular permissions for:

- Student/Teacher/Course management
- Academic year and class administration
- Attendance tracking and reporting
- Email communication systems
- Audit logging and system monitoring
- School and user management (Super Admin)
### Core API Integration 1. Authentication APIs ( /api/auth )
```
interface AuthAPI {
  register(userData: RegisterData): 
  Promise<AuthResponse>
  login(email: string, password: 
  string, rememberMe?: boolean): 
  Promise<AuthResponse>
  getProfile(): Promise<UserProfile>
  refreshToken(): 
  Promise<TokenResponse>
  logout(): Promise<void>
}
``` 2. User Management APIs ( /api/users )
```
interface UsersAPI {
  getAll(params: PaginationParams & 
  FilterParams): 
  Promise<UsersResponse>
  getById(id: string): Promise<User>
  update(id: string, data: 
  UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
}
``` 3. School Management APIs ( /api/schools )
```
interface SchoolsAPI {
  getAll(params: PaginationParams & 
  FilterParams): 
  Promise<SchoolsResponse>
  create(data: CreateSchoolData): 
  Promise<School>
  getById(id: string): 
  Promise<School>
  update(id: string, data: 
  UpdateSchoolData): Promise<School>
  delete(id: string): Promise<void>
}
``` 4. Academic Management APIs ( /api/academic )
```
interface AcademicAPI {
  academicYears: {
    getAll(params: PaginationParams)
    : Promise<AcademicYearsResponse>
    create(data: 
    CreateAcademicYearData): 
    Promise<AcademicYear>
    update(id: string, data: 
    UpdateAcademicYearData): 
    Promise<AcademicYear>
    delete(id: string): 
    Promise<void>
  }
  
  classes: {
    getAll(params: 
    PaginationParams & 
    ClassFilterParams): 
    Promise<ClassesResponse>
    create(data: CreateClassData): 
    Promise<Class>
    update(id: string, data: 
    UpdateClassData): Promise<Class>
    delete(id: string): 
    Promise<void>
  }
  
  attendance: {
    getAll(params: 
    AttendanceFilterParams): 
    Promise<AttendanceResponse>
    mark(data: MarkAttendanceData): 
    Promise<AttendanceRecord>
    update(id: string, data: 
    UpdateAttendanceData): 
    Promise<AttendanceRecord>
  }
}
``` 5. Audit & Monitoring APIs ( /api/audit )
```
interface AuditAPI {
  getLogs(params: AuditFilterParams)
  : Promise<AuditLogsResponse>
  getLogById(id: string): 
  Promise<AuditLog>
  getUserActivity(params: 
  UserActivityParams): 
  Promise<UserActivityResponse>
  getDashboard(): 
  Promise<AuditDashboardData>
  exportLogs(params: ExportParams): 
  Promise<Blob>
}
``` 6. Email Management APIs ( /api/email )
```
interface EmailAPI {
  sendSystemNotification(data: 
  SystemNotificationData): 
  Promise<EmailResponse>
  sendBulkNotification(data: 
  BulkNotificationData): 
  Promise<EmailResponse>
  sendSchoolCreationConfirmation
  (data: SchoolConfirmationData): 
  Promise<EmailResponse>
  sendUserRegistrationConfirmation
  (data: UserConfirmationData): 
  Promise<EmailResponse>
  sendPasswordReset(data: 
  PasswordResetData): 
  Promise<EmailResponse>
  sendAuditAlert(data: 
  AuditAlertData): 
  Promise<EmailResponse>
  getStats(params: EmailStatsParams)
  : Promise<EmailStats>
  testConfiguration(data: 
  TestEmailData): 
  Promise<TestResponse>
}
```
### Required Pages and Components 1. Authentication Pages
- Landing Page : Marketing page with feature highlights
- Login Page : Email/password authentication with remember me option
- Registration Page : User registration with school selection 2. Dashboard Pages
- Super Admin Dashboard : System-wide metrics, school overview, user statistics
- School Dashboard : School-specific metrics, student/teacher counts, recent activities
- User Profile Page : Personal information management, password change 3. Management Pages Super Admin Pages
- Schools Management : CRUD operations for schools with search/filter
- Users Management : Cross-tenant user management with role assignment
- System Settings : Platform-wide configuration management
- Audit Log : System activity monitoring with export functionality School Admin Pages
- Academic Management :
  - Academic years management
  - Classes and sections management
  - Student enrollment tracking
- Attendance Management :
  - Daily attendance marking
  - Attendance reports and analytics
  - Bulk attendance operations
- Email Management :
  - Compose and send notifications
  - Email statistics and delivery tracking
  - Template management Teacher Pages
- Class Management : Assigned classes and student lists
- Attendance Tracking : Mark daily attendance for assigned classes
- Grade Management : Student grade entry and management
- Communication : Send messages to students/parents Student/Parent Pages
- Academic Records : View grades, attendance, and progress
- Schedule View : Class timetables and academic calendar
- Communication : Receive notifications and messages
### UI/UX Requirements Design System
- Color Scheme : Professional green/blue palette with proper contrast
- Typography : Clean, readable fonts with proper hierarchy
- Layout : Responsive design supporting mobile, tablet, and desktop
- Navigation : Sidebar navigation with role-based menu items Component Library
```
// Core Components
- DataTable with pagination, 
sorting, and filtering
- Modal dialogs for forms and 
confirmations
- Form components with validation
- Loading states and error 
boundaries
- Toast notifications for user 
feedback
- Charts and graphs for analytics
- Calendar components for scheduling
- File upload components
- Search and filter bars
``` Responsive Design
- Mobile-first approach with breakpoints at 640px, 768px, 1024px, 1280px
- Touch-friendly interface elements
- Collapsible sidebar for mobile devices
- Optimized table layouts for smaller screens
### Data Management State Management Structure
```
// Authentication Context
interface AuthContextType {
  user: User | null
  login: (email: string, password: 
  string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

// Application State
interface AppState {
  schools: School[]
  users: User[]
  academicYears: AcademicYear[]
  classes: Class[]
  currentSchool: School | null
  notifications: Notification[]
}
``` API Client Configuration
```
// Axios configuration with 
interceptors
- Request interceptor for 
authentication tokens
- Response interceptor for error 
handling
- Automatic token refresh on 401 
responses
- Request/response logging for 
development
- Base URL configuration from 
environment variables
```
### Security Implementation Authentication Security
- JWT token storage in localStorage with expiration handling
- Automatic logout on token expiration
- CSRF protection for state-changing operations
- Secure password requirements and validation Authorization Security
- Route-level protection based on user roles
- Component-level permission checks
- API endpoint access control
- Sensitive data masking in UI
### Performance Optimization Code Splitting
- Route-based code splitting for faster initial load
- Component lazy loading for large forms
- Dynamic imports for heavy libraries Data Optimization
- Pagination for large datasets
- Search debouncing to reduce API calls
- Caching strategies for frequently accessed data
- Optimistic updates for better user experience
### Testing Requirements Unit Testing
- Component testing with React Testing Library
- API service testing with mocked responses
- Utility function testing
- Custom hook testing Integration Testing
- User flow testing for critical paths
- API integration testing
- Authentication flow testing
- Role-based access testing
### Development Workflow Environment Setup
```
# Development environment variables
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Dugsinet SIMS
VITE_APP_VERSION=1.0.0

# Production environment variables
VITE_API_URL=https://api.dugsinet.
com
VITE_ENABLE_ANALYTICS=true
``` Build Configuration
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting
- Husky for pre-commit hooks
- Vite configuration for optimal bundling
### Accessibility Requirements WCAG 2.1 Compliance
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management for modals and forms Internationalization
- Multi-language support structure
- RTL language support
- Date/time localization
- Number and currency formatting
### Deployment Considerations Build Optimization
- Tree shaking for unused code elimination
- Asset optimization and compression
- Service worker for offline functionality
- Progressive Web App (PWA) features Monitoring and Analytics
- Error tracking with detailed stack traces
- User interaction analytics
- Performance monitoring
- API response time tracking
### Documentation Requirements Technical Documentation
- API integration documentation
- Component usage guidelines
- State management patterns
- Testing strategies and examples User Documentation
- Role-specific user guides
- Feature documentation with screenshots
- Troubleshooting guides
- FAQ section