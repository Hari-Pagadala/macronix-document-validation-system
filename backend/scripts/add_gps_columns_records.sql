-- Adds latitude/longitude to records table (idempotent-ish via IF NOT EXISTS checks)
-- Run this against your application database.

ALTER TABLE records
ADD COLUMN IF NOT EXISTS "gpsLat" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "gpsLng" VARCHAR(255);
