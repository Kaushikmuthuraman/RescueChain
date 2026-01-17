# Database Schema Quick Reference

## Tables at a Glance

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **users** | All users (victims + orgs) | id, phone_number (UNIQUE), user_type, created_by |
| **credentials** | Login for NGO/DDMA/SDMA | user_id, username, password_hash |
| **ngos** | NGO details | user_id, organization_name, registration_number |
| **complaints** | Rescue requests | id, victim_id, status, assigned_to |
| **complaint_status_history** | Status audit trail | complaint_id, old_status, new_status, changed_by |
| **photo_evidence** | Photo accountability | complaint_id, complaint_status, photo_url |
| **donations** | Donations with UPI | amount, upi_transaction_id, upi_qr_code |
| **blockchain_audit_logs** | Polygon audit hashes | entity_type, entity_id, polygon_tx_hash |

## Critical Rules

### Authentication
- **Victims**: OTP only → No `credentials` record
- **NGO/DDMA/SDMA**: Username/password → Has `credentials` record

### User Creation
- **Victims**: Auto-created via OTP → `created_by = NULL`
- **Organizations**: Created by SDMA → `created_by` = SDMA user_id

### Complaints
- **Limit**: Max 4 per day per victim (trigger-enforced)
- **Lifecycle**: submitted → accepted → arriving → in_progress → resolved → fake_information

### Photos
- **Accepted**: NO photo required
- **Physical states** (arriving, in_progress, resolved): Photo REQUIRED

### Blockchain
- **Polygon**: Only audit hashes stored in `blockchain_audit_logs`
- Links via `entity_type` + `entity_id`

## Common Queries

### Find all complaints for a victim today
```sql
SELECT * FROM complaints 
WHERE victim_id = $1 
AND DATE(created_at) = CURRENT_DATE;
```

### Check complaint limit
```sql
SELECT COUNT(*) FROM complaints 
WHERE victim_id = $1 
AND DATE(created_at) = CURRENT_DATE;
-- Must be < 4
```

### Get complaint with photos
```sql
SELECT c.*, pe.photo_url, pe.uploaded_at
FROM complaints c
LEFT JOIN photo_evidence pe ON c.id = pe.complaint_id
WHERE c.id = $1;
```

### Find complaints needing photos
```sql
SELECT c.* FROM complaints c
WHERE c.status IN ('arriving', 'in_progress', 'resolved')
AND NOT EXISTS (
    SELECT 1 FROM photo_evidence pe 
    WHERE pe.complaint_id = c.id 
    AND pe.complaint_status = c.status
);
```

### Get status history
```sql
SELECT * FROM complaint_status_history
WHERE complaint_id = $1
ORDER BY created_at;
```

### Find donations for complaint
```sql
SELECT * FROM donations
WHERE complaint_id = $1
AND status = 'completed';
```

### Get audit logs for entity
```sql
SELECT * FROM blockchain_audit_logs
WHERE entity_type = $1
AND entity_id = $2
ORDER BY created_at;
```

## Foreign Keys

- `credentials.user_id` → `users.id`
- `ngos.user_id` → `users.id`
- `complaints.victim_id` → `users.id`
- `complaints.assigned_to` → `users.id`
- `users.created_by` → `users.id` (SDMA)
- `complaint_status_history.complaint_id` → `complaints.id`
- `complaint_status_history.changed_by` → `users.id`
- `photo_evidence.complaint_id` → `complaints.id`
- `photo_evidence.uploaded_by` → `users.id`
- `donations.complaint_id` → `complaints.id`
- `blockchain_audit_logs.created_by` → `users.id`

## Indexes

All foreign keys are indexed for performance. Additional indexes:
- `users.phone_number` (UNIQUE)
- `complaints.status`
- `complaints.victim_id + DATE(created_at)` (for 4/day limit)
- `blockchain_audit_logs.polygon_tx_hash` (UNIQUE)
