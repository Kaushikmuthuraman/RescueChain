# Demo OTP Service

Demo OTP authentication service for victims. Uses a fixed OTP code instead of SMS/Firebase.

## Features

- **Fixed OTP**: `123456` (no SMS/Firebase required)
- **Rate Limiting**: Max 5 attempts per 15 minutes per phone number
- **In-Memory Storage**: Rate limit tracking (use Redis in production)
- **Auto-Cleanup**: Automatically removes expired rate limit entries

## Usage

```javascript
const otpService = require('./demoOtpService');

// Generate OTP (returns fixed demo OTP)
const otp = otpService.generateOTP('+91-9123456780');

// Verify OTP
const result = otpService.verifyOTP('+91-9123456780', '123456');
if (result.valid) {
    // OTP is correct
} else {
    // Handle error: result.error, result.remainingAttempts, result.resetAt
}

// Check rate limit
const rateLimit = otpService.checkRateLimit('+91-9123456780');
if (!rateLimit.allowed) {
    // Rate limit exceeded
}

// Get rate limit status
const status = otpService.getRateLimitStatus('+91-9123456780');
```

## Rate Limiting

- **Window**: 15 minutes
- **Max Attempts**: 5 per window
- **Reset**: Automatically after window expires
- **Storage**: In-memory Map (use Redis in production for scalability)

## Production Considerations

1. **Replace Fixed OTP**: Generate random OTPs and store them temporarily
2. **Use Redis**: Replace in-memory Map with Redis for rate limiting
3. **SMS Integration**: Integrate with SMS provider (Twilio, AWS SNS, etc.)
4. **OTP Expiry**: Add OTP expiration (e.g., 10 minutes)
5. **OTP Storage**: Store OTPs in database or Redis with TTL

## API

### `generateOTP(phoneNumber)`
Returns the fixed demo OTP. In production, this would generate a random OTP and send via SMS.

### `verifyOTP(phoneNumber, otp)`
Verifies the OTP and checks rate limits. Returns:
```javascript
{
    valid: boolean,
    error: string | null,
    remainingAttempts: number,
    resetAt: Date
}
```

### `checkRateLimit(phoneNumber)`
Checks if phone number is within rate limits. Returns:
```javascript
{
    allowed: boolean,
    remainingAttempts: number,
    resetAt: Date
}
```

### `getRateLimitStatus(phoneNumber)`
Gets current rate limit status. Returns:
```javascript
{
    attempts: number,
    remainingAttempts: number,
    resetAt: Date | null
}
```
