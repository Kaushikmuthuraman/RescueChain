-- RescueChain PostgreSQL Schema
-- Database: rescuechain
-- Version: 1.0 (PostgreSQL compatible)

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('victim', 'ngo', 'ddma', 'sdma');

CREATE TYPE complaint_status AS ENUM (
    'submitted',
    'accepted',
    'arriving',
    'in_progress',
    'resolved',
    'fake_information'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_seeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_org_created_by CHECK (
        (user_type = 'victim' AND created_by IS NULL) OR
        (user_type IN ('ngo', 'ddma', 'sdma') AND created_by IS NOT NULL)
    )
);

CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_by ON users(created_by);

-- ============================================
-- CREDENTIALS (ORG USERS ONLY)
-- ============================================

CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_username ON credentials(username);

-- ============================================
-- NGOS
-- ============================================

CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ngos_user_id ON ngos(user_id);
CREATE INDEX idx_ngos_registration_number ON ngos(registration_number);

-- ============================================
-- COMPLAINTS
-- ============================================

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_text TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    urgency_level urgency_level DEFAULT 'medium',
    status complaint_status DEFAULT 'submitted',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_seeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_victim_id ON complaints(victim_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);


-- ============================================
-- COMPLAINT LIMIT TRIGGER (4 / DAY)
-- ============================================

CREATE OR REPLACE FUNCTION check_complaint_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM complaints
        WHERE victim_id = NEW.victim_id
        AND DATE(created_at) = CURRENT_DATE
    ) >= 4 THEN
        RAISE EXCEPTION 'Maximum 4 complaints per day allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_complaint_limit
BEFORE INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION check_complaint_limit();

-- ============================================
-- COMPLAINT STATUS HISTORY
-- ============================================

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
-- PHOTO EVIDENCE
-- ============================================

CREATE TABLE photo_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    complaint_status complaint_status NOT NULL,
    ipfs_cid TEXT NOT NULL,
    photo_url TEXT,
    photo_hash VARCHAR(255),
    exif_latitude DECIMAL(10,8),
    exif_longitude DECIMAL(11,8),
    exif_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_physical_status CHECK (
        complaint_status IN ('arriving', 'in_progress', 'resolved', 'fake_information')
    ),

    CONSTRAINT check_exif_geo CHECK (
        (exif_latitude IS NOT NULL AND exif_longitude IS NOT NULL)
        OR (exif_latitude IS NULL AND exif_longitude IS NULL)
    )
);

CREATE INDEX idx_photo_evidence_complaint_id ON photo_evidence(complaint_id);
CREATE INDEX idx_photo_evidence_status ON photo_evidence(complaint_status);
CREATE INDEX idx_photo_evidence_uploaded_by ON photo_evidence(uploaded_by);

-- ============================================
-- DONATIONS
-- ============================================

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name VARCHAR(255),
    donor_phone VARCHAR(15),
    donor_email VARCHAR(255),
    amount DECIMAL(12,2),
    upi_transaction_id VARCHAR(255) UNIQUE,
    upi_qr_code VARCHAR(255) DEFAULT 'COMMON-UPI-QR-001',
    ngo_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status donation_status DEFAULT 'pending',
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    is_seeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT check_amount_positive CHECK (amount IS NULL OR amount > 0)
);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_complaint_id ON donations(complaint_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_upi_transaction_id ON donations(upi_transaction_id);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);

-- ============================================
-- BLOCKCHAIN AUDIT LOGS
-- ============================================

CREATE TABLE blockchain_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB NOT NULL,
    polygon_tx_hash VARCHAR(255),
    polygon_block_number BIGINT,
    polygon_timestamp TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON blockchain_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_polygon_hash ON blockchain_audit_logs(polygon_tx_hash);
CREATE INDEX idx_audit_logs_created_at ON blockchain_audit_logs(created_at);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
BEFORE UPDATE ON credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at
BEFORE UPDATE ON ngos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLAINT STATUS HISTORY TRIGGER
-- ============================================

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
            COALESCE(NEW.assigned_to, NEW.victim_id),
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaint_status_history
AFTER UPDATE OF status ON complaints
FOR EACH ROW
EXECUTE FUNCTION create_status_history();

-- ============================================
-- BLOCKCHAIN AUDIT LOGS - LOCATION TRACKING
-- Migration: Add location and actor tracking columns
-- ============================================

ALTER TABLE blockchain_audit_logs
ADD COLUMN latitude VARCHAR(50),
ADD COLUMN longitude VARCHAR(50),
ADD COLUMN location_text TEXT,
ADD COLUMN actor_role VARCHAR(20),
ADD COLUMN actor_id UUID;

-- Add CHECK constraint for actor_role enum values
ALTER TABLE blockchain_audit_logs
ADD CONSTRAINT check_actor_role CHECK (
    actor_role IS NULL OR actor_role IN ('victim', 'ngo', 'ddma')
);

-- Add index for actor_id for faster lookups
CREATE INDEX idx_audit_logs_actor_id ON blockchain_audit_logs(actor_id);
