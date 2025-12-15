-- Update existing draft payroll records to processed status
UPDATE payroll 
SET status = 'processed' 
WHERE status = 'draft';

-- Verify the update
SELECT 
    COUNT(*) as total_payroll,
    SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
FROM payroll;
