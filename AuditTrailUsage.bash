# Get recent audit logs
GET /api/audit/logs?page=1&limit=20&operation_type=CREATE

# Get user activity for last 7 days
GET /api/audit/user-activity?days=7&user_id=123e4567-e89b-12d3-a456-426614174000

# Export audit logs as CSV
GET /api/audit/export?format=csv&start_date=2025-01-01&end_date=2025-01-31

# Get system dashboard
GET /api/audit/dashboard?days=30