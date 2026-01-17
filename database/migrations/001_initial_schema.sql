-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for RescueChain
-- Created: 2026-01-17

-- This migration creates all tables, enums, constraints, triggers, and indexes
-- Run this file in pgAdmin 4 or via psql to set up the database

-- Note: This is the same as schema.sql but formatted as a migration
-- See database/schemas/schema.sql for the complete schema

\i ../schemas/schema.sql

-- Migration complete
-- Next steps:
-- 1. Run seeders to populate initial data
-- 2. Create application users and organizations
-- 3. Set up Polygon blockchain integration
