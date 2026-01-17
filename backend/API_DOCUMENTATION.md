# RescueChain API Documentation

Complete API documentation for RescueChain backend.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## Routes

### Authentication (`/api/auth`)

#### Victim Authentication

**Generate OTP**
```
POST /api/auth/victim/otp
Body: { "phoneNumber": "+91-9123456780" }
```

**Verify OTP**
```
POST /api/auth/victim/verify
Body: { "phoneNumber": "+91-9123456780", "otp": "123456" }
```

**Get Rate Limit Status**
```
GET /api/auth/victim/rate-limit?phoneNumber=+91-9123456780
```

#### Organization Authentication

**Login**
```
POST /api/auth/organization/login
Body: { "username": "redcross", "password": "password123" }
```

**Get Current User**
```
GET /api/auth/organization/me
Headers: Authorization: Bearer <token>
```

### Complaints (`/api/complaints`)

All endpoints require authentication.

**Get All Complaints**
```
GET /api/complaints?status=submitted&limit=50&offset=0
Headers: Authorization: Bearer <token>
```
- Victims: Only see their own complaints
- NGOs: See complaints assigned to them
- DDMA/SDMA: See all complaints

**Get Single Complaint**
```
GET /api/complaints/:id
Headers: Authorization: Bearer <token>
```

**Create Complaint** (Victims only)
```
POST /api/complaints
Headers: Authorization: Bearer <token>
Body: {
  "complaintText": "Need rescue assistance",
  "location": "Building 45, Sector 12",
  "latitude": 28.5355,
  "longitude": 77.3910,
  "urgencyLevel": "critical"
}
```

**Update Complaint Status** (Organizations only)
```
PATCH /api/complaints/:id/status
Headers: Authorization: Bearer <token>
Body: {
  "status": "accepted",
  "notes": "Accepted for processing"
}
```

**Assign Complaint** (DDMA/SDMA only)
```
PATCH /api/complaints/:id/assign
Headers: Authorization: Bearer <token>
Body: {
  "assignedTo": "user-uuid"
}
```

### Photos (`/api/photos`)

All endpoints require authentication.

**Upload Photo** (Organizations only)
```
POST /api/photos
Headers: Authorization: Bearer <token>
Body: {
  "complaintId": "complaint-uuid",
  "complaintStatus": "arriving",
  "photoUrl": "/uploads/photos/photo.jpg",
  "photoHash": "abc123"
}
```

**Get Photos for Complaint**
```
GET /api/photos/complaint/:complaintId
Headers: Authorization: Bearer <token>
```

**Get Single Photo**
```
GET /api/photos/:id
Headers: Authorization: Bearer <token>
```

### Donations (`/api/donations`)

All endpoints require authentication.

**Get All Donations**
```
GET /api/donations?status=completed&complaintId=uuid&limit=50&offset=0
Headers: Authorization: Bearer <token>
```

**Get Single Donation**
```
GET /api/donations/:id
Headers: Authorization: Bearer <token>
```

**Create Donation**
```
POST /api/donations
Headers: Authorization: Bearer <token>
Body: {
  "donorName": "John Doe",
  "donorPhone": "+91-9998887770",
  "donorEmail": "john@example.com",
  "amount": 5000.00,
  "upiTransactionId": "UPI-TXN-001",
  "upiQrCode": "COMMON-UPI-QR-001",
  "complaintId": "complaint-uuid" // optional
}
```

**Update Donation Status** (Organizations only)
```
PATCH /api/donations/:id/status
Headers: Authorization: Bearer <token>
Body: {
  "status": "completed"
}
```

### Admin (`/api/admin`)

All endpoints require SDMA authentication.

**Create Organization**
```
POST /api/admin/organizations
Headers: Authorization: Bearer <token>
Body: {
  "phoneNumber": "+91-9876543218",
  "name": "New NGO",
  "userType": "ngo",
  "username": "newngo",
  "password": "password123",
  "organizationData": {
    "organizationName": "New NGO",
    "registrationNumber": "NGO-2024-001",
    "address": "123 Main St",
    "contactPerson": "John Doe",
    "email": "contact@newngo.org"
  }
}
```

**Get All Users**
```
GET /api/admin/users?userType=ngo&limit=50&offset=0
Headers: Authorization: Bearer <token>
```

**Update User Status**
```
PATCH /api/admin/users/:id/status
Headers: Authorization: Bearer <token>
Body: {
  "isActive": false
}
```

**Get System Statistics**
```
GET /api/admin/stats
Headers: Authorization: Bearer <token>
```

## Role-Based Access Control

### Roles
- `victim` - Can create complaints, view own complaints
- `ngo` - Can view assigned complaints, upload photos, update status
- `ddma` - Can view all complaints, assign complaints, manage operations
- `sdma` - Full admin access, can create organizations, view all data

### Access Matrix

| Endpoint | Victim | NGO | DDMA | SDMA |
|----------|--------|-----|------|------|
| Create Complaint | ✅ | ❌ | ❌ | ❌ |
| View Own Complaints | ✅ | ❌ | ❌ | ❌ |
| View All Complaints | ❌ | ❌ | ✅ | ✅ |
| Update Complaint Status | ❌ | ✅ | ✅ | ✅ |
| Assign Complaint | ❌ | ❌ | ✅ | ✅ |
| Upload Photo | ❌ | ✅ | ✅ | ✅ |
| Create Donation | ✅ | ✅ | ✅ | ✅ |
| Update Donation Status | ❌ | ✅ | ✅ | ✅ |
| Admin Operations | ❌ | ❌ | ❌ | ✅ |

## Database Connection

PostgreSQL connection is configured via environment variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: rescuechain)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)

**Frontend NEVER accesses database directly** - all database operations go through the API.

## Error Codes

- `AUTHENTICATION_REQUIRED` - No token provided
- `INVALID_TOKEN` - Invalid or expired token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `DUPLICATE_ENTRY` - Record already exists
- `FOREIGN_KEY_VIOLATION` - Invalid reference
- `INTERNAL_ERROR` - Server error
