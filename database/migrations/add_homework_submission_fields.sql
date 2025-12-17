-- Migration: Add submission workflow fields to homework_submissions table
-- Run this on your production database

-- Add status column
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS status ENUM('pending','submitted','late','graded') DEFAULT 'submitted';

-- Add score column
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS score DECIMAL(5,2) DEFAULT NULL;

-- Add feedback column
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT NULL;

-- Add graded_at timestamp
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP NULL DEFAULT NULL;

-- Add graded_by (teacher who graded)
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS graded_by INT DEFAULT NULL;

-- Add submission_text for text-based submissions
ALTER TABLE homework_submissions 
ADD COLUMN IF NOT EXISTS submission_text TEXT DEFAULT NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_status ON homework_submissions(status);

-- Update homework table to add total_marks if not exists
ALTER TABLE homework 
ADD COLUMN IF NOT EXISTS total_marks DECIMAL(5,2) DEFAULT 100;

-- Update homework table to add status if not exists
ALTER TABLE homework 
ADD COLUMN IF NOT EXISTS status ENUM('active','closed','cancelled') DEFAULT 'active';

-- Update homework table to add term_id if not exists
ALTER TABLE homework 
ADD COLUMN IF NOT EXISTS term_id INT DEFAULT NULL;
