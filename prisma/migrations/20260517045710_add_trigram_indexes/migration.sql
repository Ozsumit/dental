-- This is an empty migration.-- Enable the pg_trgm extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create ultra-fast search indexes for partial text matching
CREATE INDEX patient_first_name_trgm_idx ON "Patient" USING GIN ("firstName" gin_trgm_ops);
CREATE INDEX patient_last_name_trgm_idx ON "Patient" USING GIN ("lastName" gin_trgm_ops);
CREATE INDEX patient_email_trgm_idx ON "Patient" USING GIN ("email" gin_trgm_ops);