# Polygon Audit Logging Service

This service provides blockchain-backed audit logging using Polygon network. It stores only hashes on-chain, ensuring no personal data is stored on the blockchain.

## Features

- **Hash-only storage**: Only cryptographic hashes are stored on-chain, no personal data
- **Non-blocking**: Audit logging failures don't block main operations
- **Automatic sanitization**: Personal information is automatically removed before hashing
- **Database integration**: Audit logs are stored in database with blockchain transaction references

## Configuration

Add the following environment variables to your `.env` file:

```env
# Polygon Network Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com  # Polygon Mumbai testnet (default)
# For mainnet: https://polygon-rpc.com

# Polygon Wallet (required for blockchain transactions)
POLYGON_PRIVATE_KEY=your_private_key_here

# Optional: Smart Contract Address (if using custom contract)
POLYGON_CONTRACT_ADDRESS=
```

### Getting Started

1. **Create a Polygon wallet** (recommended: MetaMask)
2. **Get testnet MATIC** (for Mumbai testnet): Use a faucet like [Polygon Faucet](https://faucet.polygon.technology/)
3. **Export private key** from your wallet (keep it secure!)
4. **Set environment variables** in your `.env` file

**Note**: If `POLYGON_PRIVATE_KEY` is not set, audit logging will skip blockchain storage but still log to database.

## Events Logged

The following events are automatically logged to Polygon:

1. **Complaint Creation** (`complaint_created`)
   - Triggered when a victim creates a complaint
   - Hashes: complaint ID, location, urgency level, status, timestamp
   - Excludes: victim ID, complaint text, personal info

2. **Status Change** (`complaint_status_changed`)
   - Triggered when complaint status is updated
   - Hashes: complaint ID, old status, new status, timestamp
   - Excludes: personal information

3. **Fake Info Decision** (`complaint_fake_info_decision`)
   - Triggered when complaint is marked as fake_information
   - Hashes: complaint ID, reason, status, timestamp
   - Excludes: personal information

4. **Donation Intent** (`donation_donation_intent`)
   - Triggered when a donation is created
   - Hashes: donation ID, NGO ID, amount, status, timestamp
   - Excludes: donor name, phone, email, UPI transaction ID

## Data Sanitization

Before hashing, the following personal information is removed:

- Names (donor names, personal names)
- Phone numbers
- Email addresses
- Personal IDs (victim_id, user IDs)
- Complaint text content
- Photo URLs/CIDs
- UPI transaction IDs (optional, can be kept for audit)

## Usage

The audit logging is automatically integrated into controllers:

- `complaintsController.js`: Complaint creation and status changes
- `donationsController.js`: Donation intent creation

Manual usage (if needed):

```javascript
const { logComplaintCreation, logComplaintStatusChange, logDonationIntent } = require('../services/polygon/auditLogger');

// Log complaint creation
await logComplaintCreation(complaint, userId);

// Log status change
await logComplaintStatusChange(complaint, oldComplaint, userId, reason);

// Log donation intent
await logDonationIntent(donation, userId);
```

## Database Schema

Audit logs are stored in `blockchain_audit_logs` table:

- `entity_type`: Type of entity ('complaint', 'donation')
- `entity_id`: ID of the entity
- `action`: Action performed ('created', 'status_changed', etc.)
- `old_data`: Previous state (JSONB)
- `new_data`: New state (JSONB)
- `polygon_tx_hash`: Polygon transaction hash (unique)
- `polygon_block_number`: Block number
- `polygon_timestamp`: Block timestamp
- `created_by`: User ID performing action

## Testing

For testing without blockchain transactions, leave `POLYGON_PRIVATE_KEY` unset. The system will:
- Still create audit logs in the database
- Use mock transaction hashes
- Continue normal operations

## Security Notes

- **Never commit private keys** to version control
- Store private keys securely (use environment variables)
- Consider using a hardware wallet for production
- Private keys should have minimal MATIC balance (only for gas)
- Review and test data sanitization before production

## Troubleshooting

**Error: "POLYGON_PRIVATE_KEY environment variable is required"**
- Set the `POLYGON_PRIVATE_KEY` in your `.env` file
- Or leave it unset to use mock mode (no blockchain transactions)

**Error: "Insufficient funds for gas"**
- Get MATIC from a faucet (testnet) or purchase (mainnet)
- Ensure wallet has enough balance for transaction fees

**Audit logging fails but operations continue**
- This is expected behavior (non-blocking)
- Check console logs for error details
- Verify Polygon RPC URL is accessible
- Check network connectivity

## Files

- `polygonService.js`: Core Polygon blockchain interaction
- `auditLogger.js`: Audit logging integration with database
- `README.md`: This file
