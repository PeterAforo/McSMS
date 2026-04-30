-- Add tax columns to fee_items table
-- Migration date: 2025-04-29

ALTER TABLE fee_items 
ADD COLUMN is_taxable TINYINT(1) DEFAULT 0,
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0;
