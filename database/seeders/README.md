# Database Seeders

This directory contains seed data for development and testing.

## Files

### `seed_data.sql`
Complete seed data file containing:
- 1 SDMA user
- 2 DDMA users
- 5 NGO users
- 10 Victim users
- Credentials for all organizations
- NGO details
- Complaints across all status stages
- Photo evidence for physical statuses
- Donations with UPI references
- Complaint status history

## Usage

### Prerequisites
1. Database schema must be created first (run `database/schemas/schema.sql`)
2. PostgreSQL database must be running
3. Connected to the `rescuechain` database

### Running Seed Data

**Option 1: Using psql**
```bash
psql -U postgres -d rescuechain -f database/seeders/seed_data.sql
```

**Option 2: Using pgAdmin 4**
1. Open pgAdmin 4
2. Connect to your PostgreSQL server
3. Right-click on `rescuechain` database
4. Select "Query Tool"
5. Open `database/seeders/seed_data.sql`
6. Execute the script (F5)

**Option 3: Using command line**
```bash
\i database/seeders/seed_data.sql
```

## Seed Data Summary

### Users
- **1 SDMA**: State Disaster Management Authority (creates other orgs)
- **2 DDMA**: Delhi and Mumbai District Disaster Management Authorities
- **5 NGOs**: Red Cross, Save the Children, Oxfam, Goonj, Helpage
- **10 Victims**: Various victims with fake phone numbers

### Complaints
- **12 complaints** across all status stages:
  - `submitted`: 2 complaints
  - `accepted`: 2 complaints (no photos)
  - `arriving`: 2 complaints (with photos)
  - `in_progress`: 2 complaints (with photos)
  - `resolved`: 3 complaints (with photos)
  - `fake_information`: 1 complaint

### Photo Evidence
- **7 photos** for physical statuses (arriving, in_progress, resolved)
- No photos for accepted status (as per rules)

### Donations
- **10 donations** with various statuses:
  - `completed`: 8 donations
  - `pending`: 1 donation
  - `failed`: 1 donation
- All use common UPI QR: `COMMON-UPI-QR-001`
- Some linked to specific complaints

### Status History
- **21 status change records** tracking complaint lifecycle

## Important Notes

1. **SDMA Creation**: The seed script temporarily modifies the constraint to allow the first SDMA user to be created with self-reference. This is handled automatically in the script.

2. **Constraints**: All seed data follows the same constraints as live data:
   - Phone numbers are unique
   - Victims have no `created_by`
   - Organizations have `created_by` pointing to SDMA
   - Max 4 complaints per day per victim (seed data respects this)
   - Photos only for physical statuses

3. **is_seeded Flag**: All seeded records have `is_seeded = TRUE` for UI clarity to distinguish from live data.

4. **Fake Data**: All phone numbers, emails, and locations are fake/demo data for testing purposes.

## Verification

After running the seed data, verify with these queries:

```sql
-- Count seeded users by type
SELECT user_type, COUNT(*) 
FROM users 
WHERE is_seeded = TRUE 
GROUP BY user_type;

-- Count complaints by status
SELECT status, COUNT(*) 
FROM complaints 
WHERE is_seeded = TRUE 
GROUP BY status;

-- Count donations by status
SELECT status, COUNT(*) 
FROM donations 
WHERE is_seeded = TRUE 
GROUP BY status;

-- Verify photo evidence
SELECT complaint_status, COUNT(*) 
FROM photo_evidence 
GROUP BY complaint_status;
```

## Test Credentials

All organizations use the same test password: `password123`

- **SDMA**: username: `sdma_admin`
- **DDMA Delhi**: username: `ddma_delhi`
- **DDMA Mumbai**: username: `ddma_mumbai`
- **Red Cross**: username: `redcross`
- **Save the Children**: username: `savethechildren`
- **Oxfam**: username: `oxfam`
- **Goonj**: username: `goonj`
- **Helpage**: username: `helpage`

**Note**: Password hashes are example hashes. In production, use proper bcrypt hashing.

## Geo-coordinates

All complaints include fake but realistic geo-coordinates for Delhi/NCR region:
- Noida: ~28.5355, 77.3910
- Delhi: ~28.7041, 77.1025
- Gurgaon: ~28.4089, 77.0378
- Faridabad: ~28.4089, 77.3178
- Ghaziabad: ~28.6692, 77.4538

## Timestamps

All timestamps use IST timezone (+05:30) and are spread across January 2024 for realistic testing.
