-- RescueChain PostgreSQL Schema
-- Database: rescuechain
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User types
CREATE TYPE user_type AS ENUM ('victim', 'ngo', 'ddma', 'sdma');

-- Complaint status types
CREATE TYPE complaint_status AS ENUM (
    'submitted',
    'accepted',
    'arriving',
    'in_progress',
    'resolved',
    'fake_information'
);

-- Urgency levels
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Donation status
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores all users: Victims (auto-created via OTP) and Organizations (NGO/DDMA/SDMA created by SDMA)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- SDMA user who created this user (for NGO/DDMA/SDMA)
    is_active BOOLEAN DEFAULT TRUE,
    is_seeded BOOLEAN DEFAULT FALSE, -- Flag for UI clarity (seeded vs live data)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_org_created_by CHECK (
        (user_type = 'victim' AND created_by IS NULL) OR
        (user_type IN ('ngo', 'ddma', 'sdma') AND created_by IS NOT NULL)
    )
);

-- Index for phone number lookups
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_by ON users(created_by);

-- ============================================
-- CREDENTIALS TABLE
-- ============================================
-- Stores login credentials for NGO/DDMA/SDMA (NOT for victims - they use OTP)
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only organizations have credentials
    CONSTRAINT check_org_credentials CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = credentials.user_id 
            AND users.user_type IN ('ngo', 'ddma', 'sdma')
        )
    )
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_username ON credentials(username);

-- ============================================
-- NGOS TABLE
-- ============================================
-- Stores NGO-specific information
CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    address TEXT,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only NGO users
    CONSTRAINT check_ngo_user CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = ngos.user_id 
            AND users.user_type = 'ngo'
        )
    )
);

CREATE INDEX idx_ngos_user_id ON ngos(user_id);
CREATE INDEX idx_ngos_registration_number ON ngos(registration_number);

-- ============================================
-- COMPLAINTS TABLE
-- ============================================
-- Stores rescue complaints/requests from victims
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_text TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    urgency_level urgency_level DEFAULT 'medium',
    status complaint_status DEFAULT 'submitted',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- NGO/DDMA/SDMA user
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_seeded BOOLEAN DEFAULT FALSE, -- Flag for UI clarity (seeded vs live data)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure victim is actually a victim
    CONSTRAINT check_victim_user CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = complaints.victim_id 
            AND users.user_type = 'victim'
        )
    ),
    
    -- Ensure assigned_to is an organization
    CONSTRAINT check_assigned_org CHECK (
        assigned_to IS NULL OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = complaints.assigned_to 
            AND users.user_type IN ('ngo', 'ddma', 'sdma')
        )
    )
);

CREATE INDEX idx_complaints_victim_id ON complaints(victim_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_victim_date ON complaints(victim_id, DATE(created_at)); -- For 4 complaints/day limit

-- Function to check 4 complaints per day limit
CREATE OR REPLACE FUNCTION check_complaint_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*) 
        FROM complaints 
        WHERE victim_id = NEW.victim_id 
        AND DATE(created_at) = CURRENT_DATE
    ) >= 4 THEN
        RAISE EXCEPTION 'Maximum 4 complaints per day allowed for this victim';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce 4 complaints/day limit
CREATE TRIGGER trigger_check_complaint_limit
    BEFORE INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION check_complaint_limit();

-- ============================================
-- COMPLAINT_STATUS_HISTORY TABLE
-- ============================================
-- Tracks all status changes for complaints
CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    old_status complaint_status,
    new_status complaint_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_complaint_id ON complaint_status_history(complaint_id);
CREATE INDEX idx_status_history_created_at ON complaint_status_history(created_at);

-- ============================================
-- PHOTO_EVIDENCE TABLE
-- ============================================
-- Stores photo evidence for accountability
-- Required for: Arriving, In Progress, Resolved
-- NOT required for: Accepted
CREATE TABLE photo_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    complaint_status complaint_status NOT NULL, -- Status when photo was taken
    photo_url TEXT NOT NULL,
    photo_hash VARCHAR(255), -- Hash for verification
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure photo is for a physical status (not accepted)
    CONSTRAINT check_physical_status CHECK (
        complaint_status IN ('arriving', 'in_progress', 'resolved')
    )
);

CREATE INDEX idx_photo_evidence_complaint_id ON photo_evidence(complaint_id);
CREATE INDEX idx_photo_evidence_status ON photo_evidence(complaint_status);
CREATE INDEX idx_photo_evidence_uploaded_by ON photo_evidence(uploaded_by);

-- ============================================
-- DONATIONS TABLE
-- ============================================
-- Stores donation records with UPI QR reference
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name VARCHAR(255),
    donor_phone VARCHAR(15),
    donor_email VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    upi_transaction_id VARCHAR(255) UNIQUE, -- UPI transaction reference
    upi_qr_code VARCHAR(255), -- Reference to common UPI QR
    status donation_status DEFAULT 'pending',
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL, -- Optional: linked to specific complaint
    is_seeded BOOLEAN DEFAULT FALSE, -- Flag for UI clarity (seeded vs live data)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_complaint_id ON donations(complaint_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_upi_transaction_id ON donations(upi_transaction_id);

-- ============================================
-- BLOCKCHAIN_AUDIT_LOGS TABLE
-- ============================================
-- Stores audit logs with Polygon blockchain hashes
CREATE TABLE blockchain_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'complaint', 'donation', 'status_change', etc.
    entity_id UUID NOT NULL, -- ID of the entity being audited
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'status_changed', etc.
    old_data JSONB, -- Previous state
    new_data JSONB NOT NULL, -- New state
    polygon_tx_hash VARCHAR(255) UNIQUE, -- Polygon blockchain transaction hash
    polygon_block_number BIGINT,
    polygon_timestamp TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure polygon hash is set (enforced at application level for final state)
    CONSTRAINT check_polygon_hash CHECK (polygon_tx_hash IS NOT NULL OR polygon_tx_hash = '')
);

CREATE INDEX idx_audit_logs_entity ON blockchain_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_polygon_hash ON blockchain_audit_logs(polygon_tx_hash);
CREATE INDEX idx_audit_logs_created_at ON blockchain_audit_logs(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at BEFORE UPDATE ON ngos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create status history entry when complaint status changes
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO complaint_status_history (
            complaint_id,
            old_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.assigned_to, NEW.victim_id), -- Use assigned_to if available, else victim
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaint_status_history
    AFTER UPDATE OF status ON complaints
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_status_history();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'All users: Victims (OTP auth) and Organizations (NGO/DDMA/SDMA with credentials)';
COMMENT ON TABLE credentials IS 'Login credentials for NGO/DDMA/SDMA only. Victims use OTP.';
COMMENT ON TABLE ngos IS 'NGO-specific information linked to users table';
COMMENT ON TABLE complaints IS 'Rescue complaints from victims. Max 4 per day per victim.';
COMMENT ON TABLE complaint_status_history IS 'Complete audit trail of complaint status changes';
COMMENT ON TABLE photo_evidence IS 'Photo evidence required for physical statuses (Arriving, In Progress, Resolved). NOT required for Accepted.';
COMMENT ON TABLE donations IS 'Donation records with UPI QR reference';
COMMENT ON TABLE blockchain_audit_logs IS 'Audit logs with Polygon blockchain transaction hashes';

COMMENT ON COLUMN users.created_by IS 'SDMA user who created this user (for NGO/DDMA/SDMA only)';
COMMENT ON COLUMN complaints.status IS 'Lifecycle: submitted → accepted → arriving → in_progress → resolved → fake_information';
COMMENT ON COLUMN photo_evidence.complaint_status IS 'Status when photo was taken. Must be physical status (arriving, in_progress, resolved)';
COMMENT ON COLUMN blockchain_audit_logs.polygon_tx_hash IS 'Polygon blockchain transaction hash for immutable audit trail';
