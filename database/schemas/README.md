# Database Schema Documentation

## Overview

This directory contains the PostgreSQL database schema for RescueChain.

## Files

### `schema.sql`
Complete database schema with:
- All table definitions
- Enums (user_type, complaint_status, urgency_level, donation_status)
- Constraints and foreign keys
- Indexes for performance
- Triggers for business logic
- Comments and documentation

### `relationships.md`
Detailed documentation of:
- Entity relationships
- Relationship types (one-to-one, one-to-many, etc.)
- Business rules enforced
- Cascade behaviors

## Tables

### Core Tables

1. **users** - All system users (victims and organizations)
2. **credentials** - Login credentials for NGO/DDMA/SDMA only
3. **ngos** - NGO-specific information
4. **complaints** - Rescue complaints from victims
5. **complaint_status_history** - Status change audit trail
6. **photo_evidence** - Photo evidence for accountability
7. **donations** - Donation records with UPI references
8. **blockchain_audit_logs** - Audit logs with Polygon hashes

## Key Features

### Constraints
- `phone_number` UNIQUE across all users
- Victims auto-created (no `created_by`)
- Organizations created by SDMA (require `created_by`)
- Max 4 complaints/day per victim (trigger-enforced)
- Photo required for physical statuses only

### Triggers
- `update_updated_at_column` - Auto-update timestamps
- `check_complaint_limit` - Enforce 4 complaints/day
- `create_status_history` - Auto-log status changes

### Indexes
- Foreign key indexes for joins
- Status and date indexes for queries
- Composite indexes for business rules

## Usage

### Setup Database

```sql
-- In pgAdmin 4 or psql:
CREATE DATABASE rescuechain;
\c rescuechain
\i database/schemas/schema.sql
```

### Verify Schema

```sql
-- List all tables
\dt

-- Describe a table
\d users
\d complaints

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
```

## Business Rules

1. **Phone Number**: Must be unique across all users
2. **Victim Creation**: Auto-created via OTP, no credentials
3. **Organization Creation**: Created by SDMA, requires credentials
4. **Complaint Limit**: Max 4 per day per victim
5. **Status Lifecycle**: submitted → accepted → arriving → in_progress → resolved → fake_information
6. **Photo Requirements**: Required for physical statuses (arriving, in_progress, resolved), NOT for accepted
7. **Polygon Integration**: Only audit hashes stored, not full blockchain data

## Next Steps

1. Run migrations: `database/migrations/001_initial_schema.sql`
2. Seed initial data: `database/seeders/`
3. Configure application connection
4. Set up Polygon blockchain integration
