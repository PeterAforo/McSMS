-- Verify payroll status update
SELECT 
    COUNT(*) as total_payroll,
    SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed_count,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count
FROM payroll;

-- Show all payroll records with their status
SELECT 
    p.id,
    p.payroll_month,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    e.employee_number,
    p.basic_salary,
    p.total_earnings,
    p.total_deductions,
    p.net_salary,
    p.status
FROM payroll p
JOIN employees e ON p.employee_id = e.id
ORDER BY p.payroll_month DESC, e.employee_number;
