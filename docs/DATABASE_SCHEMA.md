# RescueChain Database Schema

## Complete Table Structure

### 1. users
**Purpose**: All system users (Victims and Organizations)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| phone_number | VARCHAR(15) | UNIQUE, NOT NULL | Phone number (unique across all users) |
| name | VARCHAR(255) | NOT NULL | User's name |
| user_type | user_type ENUM | NOT NULL | 'victim', 'ngo', 'ddma', 'sdma' |
| created_by | UUID | FK → users(id), NULL | SDMA user who created this (for orgs only) |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Rules**:
- Victims: `created_by` is NULL (auto-created via OTP)
- Organizations: `created_by` must reference SDMA user

---

### 2. credentials
**Purpose**: Login credentials for NGO/DDMA/SDMA (NOT for victims)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | UNIQUE, FK → users(id) | Links to users table |
| username | VARCHAR(255) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| last_login | TIMESTAMP | NULL | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Rules**:
- Only for `user_type IN ('ngo', 'ddma', 'sdma')`
- Victims use OTP, no credentials record

---

### 3. ngos
**Purpose**: NGO-specific information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | UNIQUE, FK → users(id) | Links to users table |
| organization_name | VARCHAR(255) | NOT NULL | NGO name |
| registration_number | VARCHAR(100) | UNIQUE | Registration number |
| address | TEXT | NULL | Physical address |
| contact_person | VARCHAR(255) | NULL | Contact person name |
| email | VARCHAR(255) | NULL | Contact email |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Rules**:
- Only for `user_type = 'ngo'`

---

### 4. complaints
**Purpose**: Rescue complaints/requests from victims

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| victim_id | UUID | FK → users(id), NOT NULL | Victim who created complaint |
| complaint_text | TEXT | NOT NULL | Complaint description |
| location | TEXT | NOT NULL | Location description |
| latitude | DECIMAL(10,8) | NULL | GPS latitude |
| longitude | DECIMAL(11,8) | NULL | GPS longitude |
| urgency_level | urgency_level ENUM | DEFAULT 'medium' | 'low', 'medium', 'high', 'critical' |
| status | complaint_status ENUM | DEFAULT 'submitted' | Current status |
| assigned_to | UUID | FK → users(id), NULL | Assigned organization |
| resolved_at | TIMESTAMP | NULL | Resolution timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Lifecycle**:
1. `submitted` - Initial state
2. `accepted` - Accepted by organization (NO photo required)
3. `arriving` - Team arriving (Photo REQUIRED)
4. `in_progress` - Rescue in progress (Photo REQUIRED)
5. `resolved` - Successfully resolved (Photo REQUIRED)
6. `fake_information` - Marked as fake (Photo REQUIRED)

**Rules**:
- Max 4 complaints per day per victim (trigger-enforced)
- `victim_id` must be `user_type = 'victim'`
- `assigned_to` must be `user_type IN ('ngo', 'ddma', 'sdma')`

---

### 5. complaint_status_history
**Purpose**: Complete audit trail of complaint status changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| complaint_id | UUID | FK → complaints(id), NOT NULL | Related complaint |
| old_status | complaint_status ENUM | NULL | Previous status |
| new_status | complaint_status ENUM | NOT NULL | New status |
| changed_by | UUID | FK → users(id), NOT NULL | User who changed status |
| notes | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Change timestamp |

**Rules**:
- Auto-created via trigger when status changes
- Complete history of all status transitions

---

### 6. photo_evidence
**Purpose**: Photo evidence for accountability

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| complaint_id | UUID | FK → complaints(id), NOT NULL | Related complaint |
| complaint_status | complaint_status ENUM | NOT NULL | Status when photo taken |
| photo_url | TEXT | NOT NULL | Photo file URL/path |
| photo_hash | VARCHAR(255) | NULL | Hash for verification |
| uploaded_by | UUID | FK → users(id), NOT NULL | User who uploaded |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

**Rules**:
- Only for physical statuses: `arriving`, `in_progress`, `resolved`
- NOT allowed for `accepted` status
- Required before status can change to physical states

---

### 7. donations
**Purpose**: Donation records with UPI QR reference

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| donor_name | VARCHAR(255) | NULL | Donor name |
| donor_phone | VARCHAR(15) | NULL | Donor phone |
| donor_email | VARCHAR(255) | NULL | Donor email |
| amount | DECIMAL(12,2) | NOT NULL, > 0 | Donation amount |
| upi_transaction_id | VARCHAR(255) | UNIQUE | UPI transaction ID |
| upi_qr_code | VARCHAR(255) | NULL | Common UPI QR reference |
| status | donation_status ENUM | DEFAULT 'pending' | 'pending', 'completed', 'failed', 'refunded' |
| complaint_id | UUID | FK → complaints(id), NULL | Optional: linked complaint |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| completed_at | TIMESTAMP | NULL | Completion timestamp |

**Rules**:
- Single common UPI QR code for all donations
- Can optionally link to specific complaint

---

### 8. blockchain_audit_logs
**Purpose**: Audit logs with Polygon blockchain transaction hashes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| entity_type | VARCHAR(50) | NOT NULL | 'complaint', 'donation', 'status_change', etc. |
| entity_id | UUID | NOT NULL | ID of audited entity |
| action | VARCHAR(100) | NOT NULL | 'created', 'updated', 'status_changed', etc. |
| old_data | JSONB | NULL | Previous state (JSON) |
| new_data | JSONB | NOT NULL | New state (JSON) |
| polygon_tx_hash | VARCHAR(255) | UNIQUE | Polygon transaction hash |
| polygon_block_number | BIGINT | NULL | Polygon block number |
| polygon_timestamp | TIMESTAMP | NULL | Polygon block timestamp |
| created_by | UUID | FK → users(id), NULL | User who created log |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Rules**:
- Polygon used ONLY for audit hashes
- `polygon_tx_hash` is unique
- Links to entities via `entity_type` + `entity_id`

---

## Relationships Summary

```
users
├── 1:1 credentials (NGO/DDMA/SDMA only)
├── 1:1 ngos (NGO only)
├── 1:N complaints (as victim_id)
├── 1:N complaints (as assigned_to)
├── 1:N complaint_status_history (as changed_by)
├── 1:N photo_evidence (as uploaded_by)
└── 1:N blockchain_audit_logs (as created_by)

complaints
├── 1:N complaint_status_history
├── 1:N photo_evidence
└── 1:N donations (optional)

users (self-referential)
└── N:1 users (created_by → SDMA user)
```

## Key Constraints

1. **Phone Number**: UNIQUE across all users
2. **Victim Creation**: Auto-created via OTP, `created_by = NULL`
3. **Organization Creation**: Created by SDMA, `created_by` required
4. **Complaint Limit**: Max 4 per day per victim (trigger)
5. **Photo Requirements**: 
   - `accepted` status: NO photo
   - `arriving`, `in_progress`, `resolved`: Photo REQUIRED
6. **Polygon**: Only audit hashes stored, not full blockchain data

## Enums

### user_type
- `victim`
- `ngo`
- `ddma`
- `sdma`

### complaint_status
- `submitted`
- `accepted`
- `arriving`
- `in_progress`
- `resolved`
- `fake_information`

### urgency_level
- `low`
- `medium`
- `high`
- `critical`

### donation_status
- `pending`
- `completed`
- `failed`
- `refunded`
