# RescueChain Backend

Node.js + Express REST API server for RescueChain platform.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Ensure PostgreSQL database is running and schema is created:
```bash
# Run schema.sql in your PostgreSQL database
psql -U postgres -d rescuechain -f ../database/schemas/schema.sql
```

4. Start the server:
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## API Endpoints

### Organization Authentication (Username + Password)

#### Login
```
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
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phoneNumber": "+91-9876543213",
      "name": "Red Cross Society",
      "userType": "ngo",
      "role": "ngo",
      "isActive": true,
      "isSeeded": true
    }
  }
}
```

#### Get Current User
```
GET /api/auth/organization/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+91-9876543213",
      "name": "Red Cross Society",
      "userType": "ngo",
      "isActive": true,
      "isSeeded": true,
      "createdAt": "2024-01-03T10:00:00.000Z",
      "username": "redcross"
    }
  }
}
```

### Victim Authentication (Demo OTP)

#### Generate OTP
```
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
  "message": "OTP generated successfully",
  "data": {
    "otp": "123456",
    "phoneNumber": "+91-9123456780",
    "expiresIn": "10 minutes",
    "rateLimit": {
      "remainingAttempts": 4,
      "resetAt": "2024-01-17T10:15:00.000Z"
    }
  }
}
```

#### Verify OTP and Login/Register
```
POST /api/auth/victim/verify
Content-Type: application/json

{
  "phoneNumber": "+91-9123456780",
  "otp": "123456"
}
```

**Response (New User):**
```json
{
  "success": true,
  "message": "Account created and logged in",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phoneNumber": "+91-9123456780",
      "name": "User 6780",
      "userType": "victim",
      "isActive": true
    }
  }
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phoneNumber": "+91-9123456780",
      "name": "Rajesh Kumar",
      "userType": "victim",
      "isActive": true
    }
  }
}
```

#### Get Rate Limit Status
```
GET /api/auth/victim/rate-limit?phoneNumber=+91-9123456780
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempts": 2,
    "remainingAttempts": 3,
    "maxAttempts": 5,
    "resetAt": "2024-01-17T10:15:00.000Z",
    "windowMinutes": 15
  }
}
```

## Demo OTP Authentication

### Features
- **Fixed OTP**: `123456` (no SMS/Firebase)
- **Phone as Identity**: Phone number uniquely identifies users
- **Auto-Create**: New victims are automatically created on first login
- **Rate Limiting**: Max 5 attempts per 15 minutes per phone number
- **JWT Tokens**: Secure token-based authentication

### Flow
1. User requests OTP with phone number
2. System returns fixed demo OTP (123456)
3. User verifies OTP
4. If phone exists → login
5. If phone doesn't exist → auto-create victim account
6. System returns JWT token

### Rate Limiting
- **Window**: 15 minutes
- **Max Attempts**: 5 per window
- **Reset**: Automatically after window expires
- **Storage**: In-memory (use Redis in production)

## Protected Routes

Use the `authenticate` middleware to protect routes:

```javascript
const { authenticate } = require('./middleware/auth/authenticate');

router.get('/protected', authenticate, (req, res) => {
    // req.user contains: { userId, phoneNumber, userType }
    res.json({ user: req.user });
});
```

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
- `PHONE_NUMBER_REQUIRED` - Phone number missing
- `INVALID_PHONE_NUMBER` - Invalid phone format
- `OTP_REQUIRED` - OTP missing
- `INVALID_OTP` - Wrong OTP
- `INVALID_OTP_FORMAT` - OTP not 6 digits
- `RATE_LIMIT_EXCEEDED` - Too many attempts
- `AUTHENTICATION_REQUIRED` - No token provided
- `INVALID_TOKEN` - Invalid/expired token
- `INTERNAL_ERROR` - Server error

## Environment Variables

See `.env.example` for required environment variables:
- Database connection (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- JWT secret (JWT_SECRET)
- Server configuration (PORT, HOST, NODE_ENV)

## Project Structure

See `backend/README.md` for detailed structure explanation.
