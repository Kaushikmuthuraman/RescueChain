# API Quick Reference Guide

Quick reference for RescueChain API endpoints and how to use them.

---

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: Update `VITE_API_BASE_URL` in frontend `.env`

---

## Authentication

### Victim Authentication (OTP)

**1. Generate OTP**
```http
POST /api/auth/victim/otp
Content-Type: application/json

{
  "phoneNumber": "+91-9123456780"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "otp": "123456",
    "phoneNumber": "+91-9123456780",
    "expiresIn": "10 minutes"
  }
}
```

**2. Verify OTP & Login**
```http
POST /api/auth/victim/verify
Content-Type: application/json

{
  "phoneNumber": "+91-9123456780",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phoneNumber": "+91-9123456780",
      "userType": "victim"
    }
  }
}
```

### Organization Authentication (Username/Password)

**Login**
```http
POST /api/auth/organization/login
Content-Type: application/json

{
  "username": "redcross",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Red Cross Society",
      "userType": "ngo"
    }
  }
}
```

**Get Current User**
```http
GET /api/auth/organization/me
Authorization: Bearer <token>
```

---

## Complaints

### Create Complaint (Victim Only)

```http
POST /api/complaints
Authorization: Bearer <victim_token>
Content-Type: multipart/form-data

complaintText: "Flood situation in Sector 15"
location: "Sector 15, Noida"
latitude: "28.5355"
longitude: "77.3910"
urgencyLevel: "high"
photo: <file>
```

**Note**: Photo is **REQUIRED** for complaint creation.

**Response:**
```json
{
  "success": true,
  "data": {
    "complaint": {
      "id": "uuid",
      "status": "submitted",
      "complaintText": "Flood situation...",
      "location": "Sector 15, Noida"
    }
  }
}
```

### Get Complaints

**List Complaints (Filtered by User Type)**
```http
GET /api/complaints?status=submitted&limit=10&offset=0
Authorization: Bearer <token>
```

**Get Single Complaint**
```http
GET /api/complaints/:id
Authorization: Bearer <token>
```

**Get Complaint Timeline**
```http
GET /api/complaints/:id/timeline
Authorization: Bearer <token>
```

### Update Complaint Status (NGO/DDMA/SDMA Only)

```http
PATCH /api/complaints/:id/status
Authorization: Bearer <ngo_token>
Content-Type: multipart/form-data

status: "accepted"
notes: "Complaint accepted, team dispatched"
photo: <file>  (required for: arriving, in_progress, resolved, fake_information)
reason: "..."  (required for fake_information)
```

**Status Flow:**
- `submitted` → `accepted` (no photo)
- `accepted` → `arriving` (photo required)
- `arriving` → `in_progress` (photo required)
- `in_progress` → `resolved` (photo required)
- Any → `fake_information` (photo + reason required)

---

## Photos

### Upload Photo Evidence

```http
POST /api/photos
Authorization: Bearer <ngo_token>
Content-Type: multipart/form-data

complaintId: "uuid"
complaintStatus: "arriving"
photo: <file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photo": {
      "id": "uuid",
      "ipfs_cid": "Qm...",
      "exif_latitude": 28.5355,
      "exif_longitude": 77.3910
    }
  }
}
```

### Get Photos for Complaint

```http
GET /api/photos/complaint/:complaintId
Authorization: Bearer <token>
```

---

## Donations

### Create Donation Intent

```http
POST /api/donations
Content-Type: application/json

{
  "ngoId": "uuid",
  "donorName": "John Doe",
  "donorPhone": "+91-9876543210",
  "donorEmail": "john@example.com"
}
```

**Note**: `ngoId` is **REQUIRED**. Amount and transaction ID are optional.

**Response:**
```json
{
  "success": true,
  "data": {
    "donation": {
      "id": "uuid",
      "ngoId": "uuid",
      "status": "pending",
      "upiQrCode": "COMMON-UPI-QR-001"
    }
  }
}
```

### Confirm Payment

```http
PATCH /api/donations/:id/confirm
Content-Type: application/json

{
  "amount": 1000,
  "upiTransactionId": "TXN123456"
}
```

### Get Donations

**List Donations**
```http
GET /api/donations?status=completed
Authorization: Bearer <token>
```

**Get Single Donation**
```http
GET /api/donations/:id
Authorization: Bearer <token>
```

**Note**: Donation amounts are **hidden** from public and NGOs. Only SDMA can see amounts.

---

## SDMA Endpoints (SDMA Only)

### System Overview

```http
GET /api/sdma/overview
Authorization: Bearer <sdma_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "victim": { "total": 10, "active": 8 },
      "ngo": { "total": 5, "active": 5 }
    },
    "complaints": {
      "submitted": 2,
      "accepted": 3,
      "resolved": 5
    },
    "donations": {
      "total": 20,
      "totalAmount": 50000,
      "avgAmount": 2500
    }
  }
}
```

### All Complaints

```http
GET /api/sdma/complaints?status=resolved&limit=50
Authorization: Bearer <sdma_token>
```

### Donation Analytics

```http
GET /api/sdma/donations/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <sdma_token>
```

### Audit Timeline (Blockchain Logs)

```http
GET /api/sdma/audit-timeline?entityType=complaint&limit=100
Authorization: Bearer <sdma_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": "uuid",
        "entityType": "complaint",
        "entityId": "uuid",
        "action": "created",
        "polygonTxHash": "0xabc123...",
        "polygonBlockNumber": 12345,
        "createdByName": "Victim User",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### All Donations (with amounts)

```http
GET /api/sdma/donations?status=completed
Authorization: Bearer <sdma_token>
```

---

## DDMA Endpoints (DDMA Only)

### Area-Wise Complaints

```http
GET /api/ddma/complaints/area-wise
Authorization: Bearer <ddma_token>
```

### NGO Coordination

```http
GET /api/ddma/ngos
Authorization: Bearer <ddma_token>
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - No token provided
- `INVALID_TOKEN` - Invalid/expired token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `PHOTO_REQUIRED` - Photo is required
- `FILE_REQUIRED` - File upload required
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TERMINAL_STATUS` - Cannot update from terminal status

---

## Testing with cURL

### Example: Create Complaint

```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "complaintText=Test complaint" \
  -F "location=Test Location" \
  -F "urgencyLevel=medium" \
  -F "photo=@/path/to/photo.jpg"
```

### Example: Update Status

```bash
curl -X PATCH http://localhost:3000/api/complaints/COMPLAINT_ID/status \
  -H "Authorization: Bearer NGO_TOKEN" \
  -F "status=accepted" \
  -F "notes=Accepted for processing"
```

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/organization/login \
  -H "Content-Type: application/json" \
  -d '{"username":"redcross","password":"password123"}'
```

---

## Rate Limiting

- **OTP Generation**: 5 attempts per 15 minutes per phone number
- **General API**: 100 requests per 15 minutes per IP
- **File Uploads**: 10MB max file size

---

## Photo Requirements

- **Formats**: JPEG, JPG, PNG, HEIC, HEIF
- **Max Size**: 10MB
- **EXIF Data**: Automatically extracted (GPS, timestamp)
- **Storage**: IPFS (Content ID stored in database)

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

For detailed API documentation, see `backend/API_DOCUMENTATION.md`
