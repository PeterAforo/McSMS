-- Add late fee and tax columns to fee_item_rules table
-- Migration date: 2025-04-29

ALTER TABLE fee_item_rules 
ADD COLUMN late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN late_fee_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
ADD COLUMN is_taxable TINYINT(1) DEFAULT 0,
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0;
