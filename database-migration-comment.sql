-- Database Migration for Google Drive Upload System
-- This is a comment-only file documenting the required schema changes
-- Run these SQL commands in your Supabase database:

-- 1. Add new logo fields to gyms table
/*
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS "White Logo URL" TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS "Black Logo URL" TEXT;

-- 2. Create uploads table to track upload sessions
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  upload_id TEXT UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES gyms(id),
  gym_name TEXT NOT NULL,
  upload_folder_id TEXT NOT NULL,
  gym_folder_id TEXT NOT NULL,
  raw_footage_folder_id TEXT NOT NULL,
  final_footage_folder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create upload_slots table to track slot folders
CREATE TABLE upload_slots (
  id SERIAL PRIMARY KEY,
  upload_id TEXT NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL CHECK (slot_name IN ('Photos', 'Videos', 'Facility Photos', 'Facility Videos')),
  drive_folder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(upload_id, slot_name)
);

-- 4. Create files table to track uploaded files
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  upload_id TEXT NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL CHECK (slot_name IN ('Photos', 'Videos', 'Facility Photos', 'Facility Videos')),
  drive_file_id TEXT NOT NULL,
  name TEXT NOT NULL,
  size_bytes BIGINT,
  mime TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX idx_uploads_gym_id ON uploads(gym_id);
CREATE INDEX idx_upload_slots_upload_id ON upload_slots(upload_id);
CREATE INDEX idx_files_upload_id ON files(upload_id);
CREATE INDEX idx_files_slot_name ON files(slot_name);

-- 6a. Enforce uniqueness to prevent duplicates per upload session
-- A file is considered the same if (upload_id, slot_name, name, size_bytes) match
ALTER TABLE files
ADD CONSTRAINT files_unique_per_upload UNIQUE (upload_id, slot_name, name, size_bytes);

-- 6. Enable Row Level Security (RLS) if needed
-- ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE upload_slots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 7. If you need to add the new columns to an existing table, run:
-- ALTER TABLE uploads ADD COLUMN gym_folder_id TEXT;
-- ALTER TABLE uploads ADD COLUMN raw_footage_folder_id TEXT;
-- ALTER TABLE uploads ADD COLUMN final_footage_folder_id TEXT;

-- 8. IMPORTANT: If you have existing tables, run these ALTER commands:
-- ALTER TABLE uploads ADD COLUMN IF NOT EXISTS gym_folder_id TEXT;
-- ALTER TABLE uploads ADD COLUMN IF NOT EXISTS raw_footage_folder_id TEXT;
-- ALTER TABLE uploads ADD COLUMN IF NOT EXISTS final_footage_folder_id TEXT;

-- 9. Update existing records to have placeholder values (if needed):
-- UPDATE uploads SET 
--   gym_folder_id = upload_folder_id,
--   raw_footage_folder_id = upload_folder_id,
--   final_footage_folder_id = upload_folder_id
-- WHERE gym_folder_id IS NULL;
*/
