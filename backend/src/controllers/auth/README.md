# Authentication Controllers

Authentication controllers for RescueChain platform.

## Victim Authentication (`victimAuthController.js`)

Demo OTP-based authentication for victims.

### Endpoints
- `POST /api/auth/victim/otp` - Generate OTP
- `POST /api/auth/victim/verify` - Verify OTP and login/register
- `GET /api/auth/victim/rate-limit` - Get rate limit status

### Flow
1. User requests OTP with phone number
2. System returns fixed demo OTP (`123456`)
3. User verifies OTP
4. If phone exists → login
5. If phone doesn't exist → auto-create victim account
6. System returns JWT token

## Organization Authentication (`organizationAuthController.js`)

Username + password authentication for NGO, DDMA, SDMA.

### Endpoints
- `POST /api/auth/organization/login` - Login with username and password
- `GET /api/auth/organization/me` - Get current authenticated user

### Features
- Works for both seeded and live accounts
- Passwords are hashed with bcrypt
- JWT includes role (userType: 'ngo', 'ddma', 'sdma')
- Accounts created only by SDMA (enforced at database level)

### Login Flow
1. User provides username and password
2. System finds credentials by username
3. System verifies password hash
4. System checks user is active and is an organization
5. System updates last login timestamp
6. System generates JWT token with role
7. User receives token for authenticated requests

### Example Request
```json
POST /api/auth/organization/login
{
  "username": "redcross",
  "password": "password123"
}
```

### Example Response
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

## JWT Token Structure

Both authentication methods generate JWT tokens with:
- `userId` - User ID (UUID)
- `phoneNumber` - User's phone number
- `userType` - User type/role: 'victim', 'ngo', 'ddma', 'sdma'
- `role` - Alias for userType (for clarity)

## Protected Routes

Use the `authenticate` middleware to protect routes:

```javascript
const { authenticate } = require('../../middleware/auth/authenticate');

router.get('/protected', authenticate, (req, res) => {
    // req.user contains: { userId, phoneNumber, userType, role }
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
- `USERNAME_REQUIRED` - Username missing
- `PASSWORD_REQUIRED` - Password missing
- `INVALID_USERNAME_FORMAT` - Invalid username format
- `INVALID_PASSWORD_FORMAT` - Invalid password format
- `INVALID_CREDENTIALS` - Wrong username or password
- `ACCOUNT_DISABLED` - Account is inactive
- `INVALID_USER_TYPE` - Wrong user type for endpoint
- `AUTHENTICATION_REQUIRED` - No token provided
- `INVALID_TOKEN` - Invalid/expired token
