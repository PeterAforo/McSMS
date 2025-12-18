-- Add due_time column to homework table
-- This allows teachers to set specific deadline times, not just dates

ALTER TABLE homework ADD COLUMN IF NOT EXISTS due_time TIME DEFAULT '23:59:00' AFTER due_date;

-- If IF NOT EXISTS doesn't work on your MySQL version, use this instead:
-- ALTER TABLE homework ADD COLUMN due_time TIME DEFAULT '23:59:00';
