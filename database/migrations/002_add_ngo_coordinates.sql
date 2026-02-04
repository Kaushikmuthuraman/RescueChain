-- Migration: Add latitude/longitude to NGOs for map visualization and nearest-NGO
ALTER TABLE ngos
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

CREATE INDEX IF NOT EXISTS idx_ngos_coordinates ON ngos(latitude, longitude);

-- Seed coordinates for existing NGOs (Delhi NCR addresses)
-- Connaught Place, New Delhi
UPDATE ngos SET latitude = 28.6315, longitude = 77.2167 WHERE address LIKE '%Connaught Place%';
-- Bandra Kurla Complex, Mumbai
UPDATE ngos SET latitude = 19.0596, longitude = 72.8656 WHERE address LIKE '%Bandra Kurla%';
-- Sector 18, Noida
UPDATE ngos SET latitude = 28.5355, longitude = 77.3910 WHERE address LIKE '%Sector 18%Noida%';
-- Hauz Khas, New Delhi
UPDATE ngos SET latitude = 28.5484, longitude = 77.2067 WHERE address LIKE '%Hauz Khas%';
-- Koramangala, Bangalore
UPDATE ngos SET latitude = 12.9352, longitude = 77.6245 WHERE address LIKE '%Koramangala%';
