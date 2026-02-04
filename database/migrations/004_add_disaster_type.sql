-- Add disaster_type enum and column to complaints for extensibility

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disaster_type') THEN
        CREATE TYPE disaster_type AS ENUM ('flood', 'fire', 'earthquake', 'landslide', 'cyclone');
    END IF;
END$$;

ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS disaster_type disaster_type;

CREATE INDEX IF NOT EXISTS idx_complaints_disaster_type ON complaints(disaster_type);

