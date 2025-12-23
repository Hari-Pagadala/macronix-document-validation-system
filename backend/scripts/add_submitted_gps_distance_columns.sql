-- Adds submitted GPS fields and distance to records table (idempotent)
-- Run against application database

ALTER TABLE records
ADD COLUMN IF NOT EXISTS "submittedGpsLat" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "submittedGpsLng" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "gpsDistanceMeters" DOUBLE PRECISION;
