# Database Relationships Documentation

## Entity Relationship Overview

### Core Relationships

```
users (1) ──< (0..1) credentials
  │
  ├── (1) ──< (0..1) ngos
  │
  ├── (1) ──< (0..*) complaints [as victim_id]
  │
  ├── (1) ──< (0..*) complaints [as assigned_to]
  │
  ├── (1) ──< (0..*) complaint_status_history [as changed_by]
  │
  ├── (1) ──< (0..*) photo_evidence [as uploaded_by]
  │
  └── (1) ──< (0..*) blockchain_audit_logs [as created_by]

complaints (1) ──< (0..*) complaint_status_history
complaints (1) ──< (0..*) photo_evidence
complaints (1) ──< (0..*) donations
```

## Detailed Relationships

### 1. Users → Credentials
- **Type**: One-to-One (Optional)
- **Constraint**: Only for `user_type IN ('ngo', 'ddma', 'sdma')`
- **Purpose**: Stores login credentials for organizations. Victims use OTP, so no credentials record.

### 2. Users → NGOs
- **Type**: One-to-One (Optional)
- **Constraint**: Only for `user_type = 'ngo'`
- **Purpose**: Stores NGO-specific information (organization name, registration, etc.)

### 3. Users → Complaints (as victim)
- **Type**: One-to-Many
- **Constraint**: `victim_id` must be `user_type = 'victim'`
- **Purpose**: Victims can create multiple complaints (max 4 per day)
- **Cascade**: DELETE CASCADE (if victim deleted, complaints deleted)

### 4. Users → Complaints (as assigned_to)
- **Type**: One-to-Many (Optional)
- **Constraint**: `assigned_to` must be `user_type IN ('ngo', 'ddma', 'sdma')`
- **Purpose**: Organizations can be assigned multiple complaints
- **Cascade**: SET NULL (if organization deleted, assignment cleared)

### 5. Users → Users (created_by)
- **Type**: Self-referential (Many-to-One)
- **Constraint**: Only for `user_type IN ('ngo', 'ddma', 'sdma')`
- **Purpose**: SDMA creates NGO/DDMA/SDMA users
- **Cascade**: SET NULL (if creator deleted, reference cleared)

### 6. Complaints → Complaint Status History
- **Type**: One-to-Many
- **Purpose**: Complete audit trail of all status changes
- **Cascade**: DELETE CASCADE (if complaint deleted, history deleted)

### 7. Complaints → Photo Evidence
- **Type**: One-to-Many
- **Constraint**: Photos only for statuses: `arriving`, `in_progress`, `resolved`
- **Purpose**: Photo-backed accountability for physical operations
- **Cascade**: DELETE CASCADE (if complaint deleted, photos deleted)

### 8. Complaints → Donations
- **Type**: One-to-Many (Optional)
- **Purpose**: Donations can be linked to specific complaints
- **Cascade**: SET NULL (if complaint deleted, donation link cleared)

### 9. Users → Complaint Status History (changed_by)
- **Type**: One-to-Many
- **Purpose**: Track who changed the complaint status
- **Cascade**: RESTRICT (cannot delete user if they have status history)

### 10. Users → Photo Evidence (uploaded_by)
- **Type**: One-to-Many
- **Purpose**: Track who uploaded the photo
- **Cascade**: RESTRICT (cannot delete user if they uploaded photos)

### 11. Users → Blockchain Audit Logs (created_by)
- **Type**: One-to-Many (Optional)
- **Purpose**: Track who created the audit log entry
- **Cascade**: SET NULL (if user deleted, reference cleared)

## Business Rules Enforced

### 1. Phone Number Uniqueness
- `phone_number` is UNIQUE across all users
- Enforced at database level

### 2. Victim Auto-Creation
- Victims are created via OTP (application logic)
- No `created_by` required for victims
- No credentials record for victims

### 3. Organization Creation
- NGO/DDMA/SDMA must be created by SDMA user
- `created_by` must reference a `user_type = 'sdma'` user
- Requires credentials record

### 4. Complaint Limit
- Max 4 complaints per day per victim
- Enforced via trigger: `trigger_check_complaint_limit`
- Checks count of complaints for same `victim_id` on `CURRENT_DATE`

### 5. Complaint Status Lifecycle
- Valid statuses: `submitted` → `accepted` → `arriving` → `in_progress` → `resolved` → `fake_information`
- Status changes automatically logged in `complaint_status_history`
- Trigger: `trigger_complaint_status_history`

### 6. Photo Requirements
- **Accepted status**: NO photo required
- **Physical statuses** (arriving, in_progress, resolved): Photo REQUIRED
- Enforced via constraint: `check_physical_status` on `photo_evidence` table
- Application logic must ensure photos exist before status change

### 7. Polygon Blockchain
- Only audit hashes stored in `blockchain_audit_logs`
- `polygon_tx_hash` is UNIQUE
- Links to entities via `entity_type` and `entity_id`

## Indexes for Performance

### Users Table
- `idx_users_phone_number` - Fast phone lookups
- `idx_users_user_type` - Filter by user type
- `idx_users_created_by` - Find users created by SDMA

### Complaints Table
- `idx_complaints_victim_id` - Find all complaints by victim
- `idx_complaints_status` - Filter by status
- `idx_complaints_assigned_to` - Find assignments
- `idx_complaints_created_at` - Date-based queries
- `idx_complaints_victim_date` - Enforce 4/day limit efficiently

### Other Tables
- Foreign key indexes on all relationship columns
- Status and date indexes for common queries
