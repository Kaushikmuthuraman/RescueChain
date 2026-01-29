# Security, Validation, and Audit Documentation

This document explains the security features, input validation, rate limiting, error handling, and audit logging implemented in RescueChain. All features are **demo-safe** and **explainable**.

## Table of Contents

1. [Input Validation](#input-validation)
2. [Rate Limiting](#rate-limiting)
3. [Error Messages](#error-messages)
4. [Audit Logging](#audit-logging)

---

## Input Validation

### Overview

Comprehensive input validation is implemented to ensure:
- Data integrity
- Security against injection attacks
- Clear, explainable validation errors
- Consistent validation patterns

### Validation Utilities

**Location**: `backend/src/middleware/validation/commonValidation.js`

Common validation functions available:
- `isValidPhoneNumber()` - Validates phone format
- `isValidEmail()` - Validates email format
- `isValidUsername()` - Validates username (alphanumeric + underscore, 3-50 chars)
- `isValidPassword()` - Validates password strength (min 8 chars, letter + number)
- `isValidUUID()` - Validates UUID format
- `isValidUrgencyLevel()` - Validates urgency levels (low, medium, high, critical)
- `isValidComplaintStatus()` - Validates complaint status values
- `isValidDonationStatus()` - Validates donation status values
- `isValidUserType()` - Validates user types (victim, ngo, ddma, sdma)
- `isValidLatitude()` - Validates latitude (-90 to 90)
- `isValidLongitude()` - Validates longitude (-180 to 180)
- `isValidPositiveNumber()` - Validates positive numbers
- `isValidNonEmptyString()` - Validates non-empty strings with length limits

### Validation Middleware

**`validateRequest(schema)`** - Factory function for creating validation middleware

Example usage:
```javascript
const { validateRequest, isValidPhoneNumber, isValidEmail } = require('../middleware/validation/commonValidation');

router.post('/example', 
    validateRequest({
        body: {
            phoneNumber: {
                required: true,
                type: 'string',
                validator: isValidPhoneNumber,
                message: 'Phone number must be in format: +91-9876543210'
            },
            email: {
                required: false,
                type: 'string',
                validator: isValidEmail,
                message: 'Email must be a valid email address'
            }
        }
    }),
    controller.handleRequest
);
```

### Error Response Format

Validation errors return:
```json
{
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
        {
            "field": "phoneNumber",
            "message": "phoneNumber is required"
        }
    ],
    "hint": "Please check the validation errors above and correct your input."
}
```

---

## Rate Limiting

### Overview

Rate limiting protects the API from abuse and ensures fair usage. All rate limiting is **explainable** with clear messages.

### Implementation

**Location**: `backend/src/middleware/auth/generalRateLimiter.js`

### Rate Limit Types

1. **Default**: 100 requests per 15 minutes
2. **Strict**: 30 requests per 15 minutes
3. **Lenient**: 200 requests per 15 minutes

### Usage

Applied globally to all `/api` routes in `app.js`:
```javascript
const { defaultRateLimiter } = require('./middleware/auth/generalRateLimiter');
app.use('/api', defaultRateLimiter);
```

### Rate Limit Headers

All responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until limit resets (when exceeded)

### Error Response

When rate limit exceeded:
```json
{
    "success": false,
    "error": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Limit: 100 requests per 15 minutes. Please try again later.",
    "retryAfter": 450,
    "resetAt": "2024-01-15T10:30:00.000Z",
    "hint": "Rate limiting protects the system from abuse. Please wait before trying again."
}
```

### Identification

Rate limiting uses:
- **Authenticated users**: User ID as identifier
- **Anonymous users**: IP address as identifier

This ensures fair limits per user, not per IP address.

---

## Error Messages

### Overview

All error messages are:
- **Demo-safe**: No sensitive data exposure
- **Explainable**: Clear, actionable messages
- **Consistent**: Standard format across all endpoints

### Error Handler

**Location**: `backend/src/middleware/errorHandler.js`

### Error Response Format

Standard error response:
```json
{
    "success": false,
    "error": "ERROR_CODE",
    "message": "Human-readable error message",
    "hint": "Helpful suggestion (when applicable)"
}
```

### Common Error Codes

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_TOKEN` | 401 | Invalid or expired JWT token |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `DUPLICATE_ENTRY` | 409 | Record already exists |
| `FOREIGN_KEY_VIOLATION` | 400 | Invalid reference to related record |
| `REQUIRED_FIELD_MISSING` | 400 | Required field is missing |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Access denied |
| `INTERNAL_ERROR` | 500 | Server error |

### Helpful Hints

The error handler automatically adds helpful hints for common errors:

- **VALIDATION_ERROR**: "Please check the validation errors above and correct your input."
- **RATE_LIMIT_EXCEEDED**: "Rate limiting protects the system from abuse. Please wait before trying again."
- **INVALID_TOKEN / TOKEN_EXPIRED**: "Your session may have expired. Please log in again."
- **DUPLICATE_ENTRY**: "This record already exists. Use a different identifier or update the existing record."

### Demo-Safe Behavior

- **Production**: Internal errors show generic message
- **Development/Demo**: Internal errors include stack traces and debugging info
- **Never exposed**: Passwords, tokens, internal database errors

---

## Audit Logging

### Overview

Comprehensive audit logging tracks all critical operations for:
- Accountability
- Debugging
- Compliance
- Blockchain immutability

### Implementation

**Location**: `backend/src/services/polygon/auditLogger.js`

### What Gets Logged

All critical operations are logged with:
- **Entity Type**: Type of entity (complaint, donation, user, etc.)
- **Entity ID**: ID of the affected entity
- **Action**: Action performed (created, updated, status_changed, deleted)
- **Data**: Sanitized data (personal info removed)
- **User ID**: User who performed the action
- **Timestamp**: When the action occurred
- **Blockchain Hash**: Immutable hash on Polygon blockchain

### Audit Middleware

**Location**: `backend/src/middleware/audit/auditMiddleware.js`

Automatically logs operations:
```javascript
const { auditMiddleware } = require('../middleware/audit/auditMiddleware');

router.post('/create',
    auditMiddleware({
        entityType: 'complaint',
        action: 'created',
        getEntityId: (req, res) => res.data.complaint.id,
        getData: (req, res) => res.data.complaint
    }),
    controller.createComplaint
);
```

### Manual Audit Logging

For custom audit logging in controllers:
```javascript
const { logManualAudit } = require('../middleware/audit/auditMiddleware');

await logManualAudit({
    entityType: 'complaint',
    entityId: complaintId,
    action: 'status_changed',
    data: { status: 'resolved' },
    oldData: { status: 'in_progress' },
    userId: req.user.userId
});
```

### Data Sanitization

All audit logs automatically sanitize personal information:
- Phone numbers: Redacted
- Email addresses: Redacted
- Passwords: Never logged
- Sensitive data: Removed before logging

### Non-Blocking

Audit logging is **non-blocking**:
- Main operations continue even if audit logging fails
- Errors are logged but don't affect user experience
- System remains resilient

### Blockchain Integration

All audit logs are:
1. **Stored in database** (`blockchain_audit_logs` table)
2. **Hashed and logged to Polygon blockchain** (immutable proof)
3. **Linked via transaction hash** (verifiable)

---

## Demo-Safe Features

All features are designed to be **demo-safe** and **explainable**:

### ✅ What This Means

1. **Clear Messages**: All errors are human-readable and actionable
2. **No Data Leaks**: Sensitive data never exposed in errors
3. **Explainable**: Rate limits, validations, and errors can be explained to stakeholders
4. **Transparent**: All security measures are documented and visible
5. **Resilient**: Failures don't crash the system (audit logging, rate limiting failures)

### 🔒 Security Best Practices

- Input validation prevents injection attacks
- Rate limiting prevents abuse
- Error messages don't expose internals
- Audit logging provides accountability
- All sensitive data is sanitized before logging

---

## Summary

The RescueChain API includes:

1. ✅ **Comprehensive Input Validation** - All inputs validated with clear error messages
2. ✅ **General Rate Limiting** - 100 requests/15min default (configurable)
3. ✅ **Clear Error Messages** - Demo-safe, explainable, actionable
4. ✅ **Audit Logging** - All critical operations logged to blockchain

All features work together to create a **secure, explainable, demo-safe system**.
