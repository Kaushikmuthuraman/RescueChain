-- Analytics-focused indexes to optimize dashboard/statistics queries

-- Complaints: support filtering and aggregation by location
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(location);

-- Complaints: support resolution-time analytics
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_at ON complaints(resolved_at);

-- Complaints: composite index for NGO performance trends (resolved by NGO over time)
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to_resolved_at
    ON complaints(assigned_to, resolved_at);

-- Complaints: composite index for active / high-urgency filters
CREATE INDEX IF NOT EXISTS idx_complaints_urgency_status
    ON complaints(urgency_level, status);

-- Complaint status history: ensure fast lookup by complaint and time
CREATE INDEX IF NOT EXISTS idx_status_history_complaint_created_at
    ON complaint_status_history(complaint_id, created_at);

