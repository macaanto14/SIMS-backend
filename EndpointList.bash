# Authentication (Public)
POST /api/auth/register
POST /api/auth/login

# Authentication (Protected)  
GET /api/auth/profile

# Schools (All Protected)
GET /api/schools
GET /api/schools/:id
POST /api/schools
PUT /api/schools/:id

# Users (All Protected)
GET /api/users
POST /api/users
GET /api/users/students
POST /api/users/fees/collect

# Academic (All Protected)
GET /api/academic-years
POST /api/academic-years
GET /api/classes
POST /api/classes
GET /api/attendance
POST /api/attendance

# System
GET /health
GET /api
GET /api-docs
GET /docs