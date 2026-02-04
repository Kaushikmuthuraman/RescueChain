-- RescueChain Seed Data
-- This file contains seed data for development and testing
-- All data follows the same constraints as live data
-- is_seeded flag is set to TRUE for UI clarity

-- IMPORTANT: Before running this seed data, you may need to temporarily
-- modify the constraint to allow the first SDMA user to be created.
-- Alternatively, create the first SDMA manually, then run this script.

-- ============================================
-- STEP 1: Create SDMA User (First User)
-- ============================================
-- Note: The constraint requires SDMA to have created_by, but it's the first user.
-- Solution: Temporarily allow NULL for the first SDMA, then update it.

-- Option 1: If constraint allows, insert with self-reference
-- Option 2: Temporarily modify constraint (see below)
-- Option 3: Create first SDMA manually before running this script

-- Temporarily drop and recreate constraint to allow first SDMA
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_org_created_by;

-- Insert SDMA user
INSERT INTO users (id, phone_number, name, user_type, created_by, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '+91-9876543210', 'State Disaster Management Authority', 'sdma', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-01 10:00:00+05:30', '2024-01-01 10:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- Recreate constraint
ALTER TABLE users ADD CONSTRAINT check_org_created_by CHECK (
    (user_type = 'victim' AND created_by IS NULL) OR
    (user_type IN ('ngo', 'ddma', 'sdma') AND created_by IS NOT NULL)
);

-- ============================================
-- STEP 2: Create DDMA Users (2)
-- ============================================
INSERT INTO users (id, phone_number, name, user_type, created_by, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000002', '+91-9876543211', 'Delhi District Disaster Management Authority', 'ddma', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-02 10:00:00+05:30', '2024-01-02 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000003', '+91-9876543212', 'Mumbai District Disaster Management Authority', 'ddma', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-02 11:00:00+05:30', '2024-01-02 11:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Create NGO Users (5)
-- ============================================
INSERT INTO users (id, phone_number, name, user_type, created_by, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000004', '+91-9876543213', 'Red Cross Society', 'ngo', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-03 10:00:00+05:30', '2024-01-03 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000005', '+91-9876543214', 'Save the Children Foundation', 'ngo', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-03 11:00:00+05:30', '2024-01-03 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000006', '+91-9876543215', 'Oxfam India', 'ngo', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-03 12:00:00+05:30', '2024-01-03 12:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000007', '+91-9876543216', 'Goonj', 'ngo', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-03 13:00:00+05:30', '2024-01-03 13:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000008', '+91-9876543217', 'Helpage India', 'ngo', '00000000-0000-0000-0000-000000000001', TRUE, '2024-01-03 14:00:00+05:30', '2024-01-03 14:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 4: Create Victim Users (10)
-- ============================================
INSERT INTO users (id, phone_number, name, user_type, created_by, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000101', '+91-9123456780', 'Rajesh Kumar', 'victim', NULL, TRUE, '2024-01-10 08:00:00+05:30', '2024-01-10 08:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000102', '+91-9123456781', 'Priya Sharma', 'victim', NULL, TRUE, '2024-01-10 09:00:00+05:30', '2024-01-10 09:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000103', '+91-9123456782', 'Amit Patel', 'victim', NULL, TRUE, '2024-01-10 10:00:00+05:30', '2024-01-10 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000104', '+91-9123456783', 'Sunita Devi', 'victim', NULL, TRUE, '2024-01-10 11:00:00+05:30', '2024-01-10 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000105', '+91-9123456784', 'Vikram Singh', 'victim', NULL, TRUE, '2024-01-10 12:00:00+05:30', '2024-01-10 12:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000106', '+91-9123456785', 'Anjali Mehta', 'victim', NULL, TRUE, '2024-01-11 08:00:00+05:30', '2024-01-11 08:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000107', '+91-9123456786', 'Rahul Verma', 'victim', NULL, TRUE, '2024-01-11 09:00:00+05:30', '2024-01-11 09:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000108', '+91-9123456787', 'Kavita Reddy', 'victim', NULL, TRUE, '2024-01-11 10:00:00+05:30', '2024-01-11 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000109', '+91-9123456788', 'Mohammed Ali', 'victim', NULL, TRUE, '2024-01-11 11:00:00+05:30', '2024-01-11 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000110', '+91-9123456789', 'Deepika Nair', 'victim', NULL, TRUE, '2024-01-11 12:00:00+05:30', '2024-01-11 12:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- STEP 5: Create Credentials for Organizations
-- ============================================
-- Demo accounts: username + password123
-- Hash: bcrypt.hash("password123", 10). All org accounts (SDMA, DDMA, NGO) share it.
INSERT INTO credentials (id, user_id, username, password_hash, created_at, updated_at)
VALUES 
    -- SDMA
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'sdma_admin', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-01 10:00:00+05:30', '2024-01-01 10:00:00+05:30'),
    -- DDMA
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000002', 'ddma_delhi', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-02 10:00:00+05:30', '2024-01-02 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000003', 'ddma_mumbai', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-02 11:00:00+05:30', '2024-01-02 11:00:00+05:30'),
    -- NGOs
    ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000004', 'redcross', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-03 10:00:00+05:30', '2024-01-03 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000005', 'savethechildren', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-03 11:00:00+05:30', '2024-01-03 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000006', 'oxfam', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-03 12:00:00+05:30', '2024-01-03 12:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000007', 'goonj', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-03 13:00:00+05:30', '2024-01-03 13:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000008', 'helpage', '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK', '2024-01-03 14:00:00+05:30', '2024-01-03 14:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 6: Create NGO Details (with coordinates for map)
-- ============================================
INSERT INTO ngos (id, user_id, organization_name, registration_number, address, latitude, longitude, contact_person, email, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000004', 'Red Cross Society', 'NGO-RC-2020-001', '123, Connaught Place, New Delhi - 110001', 28.6315, 77.2167, 'Dr. Ramesh Kumar', 'contact@redcross.in', '2024-01-03 10:00:00+05:30', '2024-01-03 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000005', 'Save the Children Foundation', 'NGO-STC-2019-045', '456, Bandra Kurla Complex, Mumbai - 400051', 19.0596, 72.8656, 'Ms. Priya Menon', 'info@savethechildren.in', '2024-01-03 11:00:00+05:30', '2024-01-03 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000006', 'Oxfam India', 'NGO-OXF-2018-078', '789, Sector 18, Noida - 201301', 28.5355, 77.3910, 'Mr. Anil Sharma', 'support@oxfamindia.org', '2024-01-03 12:00:00+05:30', '2024-01-03 12:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000007', 'Goonj', 'NGO-GNJ-2017-112', '321, Hauz Khas, New Delhi - 110016', 28.5484, 77.2067, 'Ms. Anshu Gupta', 'hello@goonj.org', '2024-01-03 13:00:00+05:30', '2024-01-03 13:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000008', 'Helpage India', 'NGO-HPI-2016-203', '654, Koramangala, Bangalore - 560095', 12.9352, 77.6245, 'Dr. Suresh Rao', 'contact@helpageindia.org', '2024-01-03 14:00:00+05:30', '2024-01-03 14:00:00+05:30')
ON CONFLICT (id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- ============================================
-- STEP 7: Create Complaints (Across All Stages)
-- ============================================
-- Note: Max 4 complaints per day per victim (we'll create 3-4 per victim across different days)

-- Victim 1: Rajesh Kumar - 4 complaints
INSERT INTO complaints (id, victim_id, complaint_text, location, latitude, longitude, urgency_level, status, assigned_to, resolved_at, is_seeded, created_at, updated_at)
VALUES 
    -- Submitted (not yet accepted)
    ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', 'Trapped in flooded building, water level rising. Need immediate rescue.', 'Building No. 45, Sector 12, Noida', 28.5355, 77.3910, 'critical', 'submitted', NULL, NULL, TRUE, '2024-01-15 14:30:00+05:30', '2024-01-15 14:30:00+05:30'),
    -- Accepted (no photo required)
    ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000101', 'Family stuck on roof, no food or water for 2 days.', 'House No. 23, Krishna Nagar, Delhi', 28.7041, 77.1025, 'high', 'accepted', '00000000-0000-0000-0000-000000000004', NULL, TRUE, '2024-01-16 09:15:00+05:30', '2024-01-16 10:00:00+05:30'),
    -- Arriving (photo required)
    ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101', 'Elderly person needs medical assistance, cannot move.', 'Flat 302, Green Park, Delhi', 28.5275, 77.2150, 'high', 'arriving', '00000000-0000-0000-0000-000000000005', NULL, TRUE, '2024-01-17 11:20:00+05:30', '2024-01-17 12:00:00+05:30'),
    -- In Progress (photo required)
    ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000101', 'Child separated from family during evacuation.', 'School Ground, Sector 15, Noida', 28.5675, 77.3250, 'critical', 'in_progress', '00000000-0000-0000-0000-000000000006', NULL, TRUE, '2024-01-18 08:45:00+05:30', '2024-01-18 09:30:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- Victim 2: Priya Sharma - 3 complaints
INSERT INTO complaints (id, victim_id, complaint_text, location, latitude, longitude, urgency_level, status, assigned_to, resolved_at, is_seeded, created_at, updated_at)
VALUES 
    -- Resolved (photo required)
    ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000102', 'Rescued successfully, all family members safe.', 'Rescue Camp, Sector 20, Noida', 28.6000, 77.3500, 'medium', 'resolved', '00000000-0000-0000-0000-000000000004', '2024-01-19 16:00:00+05:30', TRUE, '2024-01-19 10:00:00+05:30', '2024-01-19 16:00:00+05:30'),
    -- Fake Information
    ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000102', 'False alarm, situation under control.', 'Apartment Complex, Gurgaon', 28.4089, 77.0378, 'low', 'fake_information', '00000000-0000-0000-0000-000000000002', '2024-01-20 14:00:00+05:30', TRUE, '2024-01-20 12:00:00+05:30', '2024-01-20 14:00:00+05:30'),
    -- Submitted
    ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000102', 'Need medical supplies, running low on medicines.', 'Clinic, Sector 18, Noida', 28.5355, 77.3910, 'medium', 'submitted', NULL, NULL, TRUE, '2024-01-21 15:30:00+05:30', '2024-01-21 15:30:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- Victim 3: Amit Patel - 2 complaints
INSERT INTO complaints (id, victim_id, complaint_text, location, latitude, longitude, urgency_level, status, assigned_to, resolved_at, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000103', 'Building collapse, multiple people trapped.', 'Construction Site, Dwarka, Delhi', 28.5925, 77.0450, 'critical', 'in_progress', '00000000-0000-0000-0000-000000000007', NULL, TRUE, '2024-01-22 07:00:00+05:30', '2024-01-22 08:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000103', 'Rescue completed, all safe.', 'Hospital, Dwarka', 28.5925, 77.0450, 'low', 'resolved', '00000000-0000-0000-0000-000000000007', '2024-01-22 18:00:00+05:30', TRUE, '2024-01-22 12:00:00+05:30', '2024-01-22 18:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- Victim 4: Sunita Devi - 2 complaints
INSERT INTO complaints (id, victim_id, complaint_text, location, latitude, longitude, urgency_level, status, assigned_to, resolved_at, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000104', 'Need food and water, stranded for 3 days.', 'Village, Faridabad', 28.4089, 77.3178, 'high', 'arriving', '00000000-0000-0000-0000-000000000008', NULL, TRUE, '2024-01-23 09:00:00+05:30', '2024-01-23 10:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000104', 'Help received, situation improving.', 'Relief Camp, Faridabad', 28.4089, 77.3178, 'medium', 'resolved', '00000000-0000-0000-0000-000000000008', '2024-01-23 20:00:00+05:30', TRUE, '2024-01-23 14:00:00+05:30', '2024-01-23 20:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- Victim 5: Vikram Singh - 1 complaint
INSERT INTO complaints (id, victim_id, complaint_text, location, latitude, longitude, urgency_level, status, assigned_to, resolved_at, is_seeded, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000105', 'Emergency evacuation needed, flood water rising.', 'Riverside Area, Ghaziabad', 28.6692, 77.4538, 'critical', 'accepted', '00000000-0000-0000-0000-000000000003', NULL, TRUE, '2024-01-24 06:00:00+05:30', '2024-01-24 07:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 8: Create Photo Evidence (FIXED)
-- ============================================

INSERT INTO photo_evidence (
    id,
    complaint_id,
    complaint_status,
    ipfs_cid,
    photo_url,
    photo_hash,
    exif_timestamp,
    uploaded_by,
    uploaded_at
)
VALUES
    -- arriving
    (
        '00000000-0000-0000-0000-000000000501',
        '00000000-0000-0000-0000-000000000403',
        'arriving',
        'QmMockArriving001',
        '/uploads/photos/rescue_arriving_001.jpg',
        'abc123def456ghi789',
        '2024-01-17 12:10:00+05:30',
        '00000000-0000-0000-0000-000000000005',
        '2024-01-17 12:15:00+05:30'
    ),
    (
        '00000000-0000-0000-0000-000000000502',
        '00000000-0000-0000-0000-000000000410',
        'arriving',
        'QmMockArriving002',
        '/uploads/photos/rescue_arriving_002.jpg',
        'xyz789uvw456rst123',
        '2024-01-23 10:25:00+05:30',
        '00000000-0000-0000-0000-000000000008',
        '2024-01-23 10:30:00+05:30'
    ),

    -- in_progress
    (
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000404',
        'in_progress',
        'QmMockProgress001',
        '/uploads/photos/rescue_inprogress_001.jpg',
        'mno456pqr789stu012',
        '2024-01-18 09:40:00+05:30',
        '00000000-0000-0000-0000-000000000006',
        '2024-01-18 09:45:00+05:30'
    ),
    (
        '00000000-0000-0000-0000-000000000504',
        '00000000-0000-0000-0000-000000000408',
        'in_progress',
        'QmMockProgress002',
        '/uploads/photos/rescue_inprogress_002.jpg',
        'vwx123yza456bcd789',
        '2024-01-22 08:25:00+05:30',
        '00000000-0000-0000-0000-000000000007',
        '2024-01-22 08:30:00+05:30'
    ),

    -- resolved
    (
        '00000000-0000-0000-0000-000000000505',
        '00000000-0000-0000-0000-000000000405',
        'resolved',
        'QmMockResolved001',
        '/uploads/photos/rescue_resolved_001.jpg',
        'efg012hij345klm678',
        '2024-01-19 16:10:00+05:30',
        '00000000-0000-0000-0000-000000000004',
        '2024-01-19 16:15:00+05:30'
    ),
    (
        '00000000-0000-0000-0000-000000000506',
        '00000000-0000-0000-0000-000000000409',
        'resolved',
        'QmMockResolved002',
        '/uploads/photos/rescue_resolved_002.jpg',
        'nop789qrs012tuv345',
        '2024-01-22 18:10:00+05:30',
        '00000000-0000-0000-0000-000000000007',
        '2024-01-22 18:15:00+05:30'
    ),
    (
        '00000000-0000-0000-0000-000000000507',
        '00000000-0000-0000-0000-000000000411',
        'resolved',
        'QmMockResolved003',
        '/uploads/photos/rescue_resolved_003.jpg',
        'ghi678jkl901mno234',
        '2024-01-23 20:25:00+05:30',
        '00000000-0000-0000-0000-000000000008',
        '2024-01-23 20:30:00+05:30'
    )
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- STEP 9: Create Donations
-- ============================================
INSERT INTO donations (id, donor_name, donor_phone, donor_email, amount, upi_transaction_id, upi_qr_code, status, complaint_id, is_seeded, created_at, updated_at, completed_at)
VALUES 
    ('00000000-0000-0000-0000-000000000601', 'Anonymous Donor', NULL, NULL, 5000.00, 'UPI-TXN-20240115-001', 'COMMON-UPI-QR-001', 'completed', '00000000-0000-0000-0000-000000000401', TRUE, '2024-01-15 15:00:00+05:30', '2024-01-15 15:05:00+05:30', '2024-01-15 15:05:00+05:30'),
    ('00000000-0000-0000-0000-000000000602', 'Ramesh Agarwal', '+91-9998887770', 'ramesh.agarwal@email.com', 10000.00, 'UPI-TXN-20240116-002', 'COMMON-UPI-QR-001', 'completed', NULL, TRUE, '2024-01-16 11:00:00+05:30', '2024-01-16 11:02:00+05:30', '2024-01-16 11:02:00+05:30'),
    ('00000000-0000-0000-0000-000000000603', 'Sneha Kapoor', '+91-9998887771', 'sneha.kapoor@email.com', 2500.00, 'UPI-TXN-20240117-003', 'COMMON-UPI-QR-001', 'completed', '00000000-0000-0000-0000-000000000403', TRUE, '2024-01-17 13:00:00+05:30', '2024-01-17 13:01:00+05:30', '2024-01-17 13:01:00+05:30'),
    ('00000000-0000-0000-0000-000000000604', 'Corporate Donation', '+91-9998887772', 'corporate@company.com', 50000.00, 'UPI-TXN-20240118-004', 'COMMON-UPI-QR-001', 'completed', NULL, TRUE, '2024-01-18 10:00:00+05:30', '2024-01-18 10:03:00+05:30', '2024-01-18 10:03:00+05:30'),
    ('00000000-0000-0000-0000-000000000605', 'Anonymous Donor', NULL, NULL, 1500.00, 'UPI-TXN-20240119-005', 'COMMON-UPI-QR-001', 'pending', '00000000-0000-0000-0000-000000000405', TRUE, '2024-01-19 17:00:00+05:30', '2024-01-19 17:00:00+05:30', NULL),
    ('00000000-0000-0000-0000-000000000606', 'Priya Malhotra', '+91-9998887773', 'priya.malhotra@email.com', 7500.00, 'UPI-TXN-20240120-006', 'COMMON-UPI-QR-001', 'completed', '00000000-0000-0000-0000-000000000408', TRUE, '2024-01-20 14:00:00+05:30', '2024-01-20 14:02:00+05:30', '2024-01-20 14:02:00+05:30'),
    ('00000000-0000-0000-0000-000000000607', 'Anonymous Donor', NULL, NULL, 3000.00, 'UPI-TXN-20240121-007', 'COMMON-UPI-QR-001', 'failed', NULL, TRUE, '2024-01-21 16:00:00+05:30', '2024-01-21 16:00:00+05:30', NULL),
    ('00000000-0000-0000-0000-000000000608', 'Amit Shah', '+91-9998887774', 'amit.shah@email.com', 20000.00, 'UPI-TXN-20240122-008', 'COMMON-UPI-QR-001', 'completed', NULL, TRUE, '2024-01-22 09:00:00+05:30', '2024-01-22 09:04:00+05:30', '2024-01-22 09:04:00+05:30'),
    ('00000000-0000-0000-0000-000000000609', 'Kavita Desai', '+91-9998887775', 'kavita.desai@email.com', 12000.00, 'UPI-TXN-20240123-009', 'COMMON-UPI-QR-001', 'completed', '00000000-0000-0000-0000-000000000410', TRUE, '2024-01-23 11:00:00+05:30', '2024-01-23 11:02:00+05:30', '2024-01-23 11:02:00+05:30'),
    ('00000000-0000-0000-0000-000000000610', 'Anonymous Donor', NULL, NULL, 8000.00, 'UPI-TXN-20240124-010', 'COMMON-UPI-QR-001', 'completed', NULL, TRUE, '2024-01-24 08:00:00+05:30', '2024-01-24 08:01:00+05:30', '2024-01-24 08:01:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 10: Create Complaint Status History
-- ============================================
-- Status history is auto-created by trigger, but we'll insert some for seeded data
-- Note: Trigger will also create entries, so these are for initial state

INSERT INTO complaint_status_history (id, complaint_id, old_status, new_status, changed_by, notes, created_at)
VALUES 
    -- Complaint 402: submitted -> accepted
    ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000402', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000004', 'Complaint accepted by Red Cross Society', '2024-01-16 10:00:00+05:30'),
    
    -- Complaint 403: submitted -> accepted -> arriving
    ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000403', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000005', 'Complaint accepted by Save the Children', '2024-01-17 11:30:00+05:30'),
    ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000403', 'accepted', 'arriving', '00000000-0000-0000-0000-000000000005', 'Rescue team dispatched and arriving', '2024-01-17 12:00:00+05:30'),
    
    -- Complaint 404: submitted -> accepted -> arriving -> in_progress
    ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000404', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000006', 'Complaint accepted by Oxfam', '2024-01-18 09:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000404', 'accepted', 'arriving', '00000000-0000-0000-0000-000000000006', 'Rescue team arriving at location', '2024-01-18 09:15:00+05:30'),
    ('00000000-0000-0000-0000-000000000706', '00000000-0000-0000-0000-000000000404', 'arriving', 'in_progress', '00000000-0000-0000-0000-000000000006', 'Rescue operation in progress', '2024-01-18 09:30:00+05:30'),
    
    -- Complaint 405: submitted -> accepted -> arriving -> in_progress -> resolved
    ('00000000-0000-0000-0000-000000000707', '00000000-0000-0000-0000-000000000405', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000004', 'Complaint accepted', '2024-01-19 10:30:00+05:30'),
    ('00000000-0000-0000-0000-000000000708', '00000000-0000-0000-0000-000000000405', 'accepted', 'arriving', '00000000-0000-0000-0000-000000000004', 'Team arriving', '2024-01-19 11:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000709', '00000000-0000-0000-0000-000000000405', 'arriving', 'in_progress', '00000000-0000-0000-0000-000000000004', 'Rescue in progress', '2024-01-19 12:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000710', '00000000-0000-0000-0000-000000000405', 'in_progress', 'resolved', '00000000-0000-0000-0000-000000000004', 'Rescue completed successfully', '2024-01-19 16:00:00+05:30'),
    
    -- Complaint 406: submitted -> accepted -> fake_information
    ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000406', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000002', 'Complaint accepted for verification', '2024-01-20 13:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000406', 'accepted', 'fake_information', '00000000-0000-0000-0000-000000000002', 'Verified as false information', '2024-01-20 14:00:00+05:30'),
    
    -- Complaint 408: submitted -> accepted -> arriving -> in_progress
    ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000408', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000007', 'Complaint accepted', '2024-01-22 07:30:00+05:30'),
    ('00000000-0000-0000-0000-000000000714', '00000000-0000-0000-0000-000000000408', 'accepted', 'arriving', '00000000-0000-0000-0000-000000000007', 'Team arriving', '2024-01-22 07:45:00+05:30'),
    ('00000000-0000-0000-0000-000000000715', '00000000-0000-0000-0000-000000000408', 'arriving', 'in_progress', '00000000-0000-0000-0000-000000000007', 'Rescue operation started', '2024-01-22 08:00:00+05:30'),
    
    -- Complaint 409: in_progress -> resolved
    ('00000000-0000-0000-0000-000000000716', '00000000-0000-0000-0000-000000000409', 'in_progress', 'resolved', '00000000-0000-0000-0000-000000000007', 'All rescued successfully', '2024-01-22 18:00:00+05:30'),
    
    -- Complaint 410: submitted -> accepted -> arriving
    ('00000000-0000-0000-0000-000000000717', '00000000-0000-0000-0000-000000000410', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000008', 'Complaint accepted', '2024-01-23 09:30:00+05:30'),
    ('00000000-0000-0000-0000-000000000718', '00000000-0000-0000-0000-000000000410', 'accepted', 'arriving', '00000000-0000-0000-0000-000000000008', 'Relief team arriving', '2024-01-23 10:00:00+05:30'),
    
    -- Complaint 411: arriving -> in_progress -> resolved
    ('00000000-0000-0000-0000-000000000719', '00000000-0000-0000-0000-000000000411', 'arriving', 'in_progress', '00000000-0000-0000-0000-000000000008', 'Relief distribution in progress', '2024-01-23 15:00:00+05:30'),
    ('00000000-0000-0000-0000-000000000720', '00000000-0000-0000-0000-000000000411', 'in_progress', 'resolved', '00000000-0000-0000-0000-000000000008', 'Relief provided successfully', '2024-01-23 20:00:00+05:30'),
    
    -- Complaint 412: submitted -> accepted
    ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000412', 'submitted', 'accepted', '00000000-0000-0000-0000-000000000003', 'Complaint accepted by DDMA Mumbai', '2024-01-24 07:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification Queries (Optional)
-- ============================================
-- Run these to verify seed data:

-- SELECT COUNT(*) FROM users WHERE is_seeded = TRUE;
-- SELECT COUNT(*) FROM users WHERE user_type = 'victim' AND is_seeded = TRUE;
-- SELECT COUNT(*) FROM users WHERE user_type = 'ngo' AND is_seeded = TRUE;
-- SELECT COUNT(*) FROM users WHERE user_type = 'ddma' AND is_seeded = TRUE;
-- SELECT COUNT(*) FROM users WHERE user_type = 'sdma' AND is_seeded = TRUE;
-- SELECT COUNT(*) FROM complaints WHERE is_seeded = TRUE;
-- SELECT status, COUNT(*) FROM complaints WHERE is_seeded = TRUE GROUP BY status;
-- SELECT COUNT(*) FROM photo_evidence;
-- SELECT COUNT(*) FROM donations WHERE is_seeded = TRUE;
