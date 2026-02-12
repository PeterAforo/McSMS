-- Fix classes table level column
-- Change from ENUM to VARCHAR to support dynamic education levels

-- First, alter the column to VARCHAR
ALTER TABLE classes MODIFY COLUMN level VARCHAR(50) NULL;

-- Also fix subjects table if it has the same issue
ALTER TABLE subjects MODIFY COLUMN level VARCHAR(50) NULL;
