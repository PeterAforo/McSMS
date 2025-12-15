-- Add default salary components including taxes
-- Run this in phpMyAdmin to populate salary components

-- Clear existing components (optional - comment out if you want to keep existing)
-- DELETE FROM salary_components;

-- Insert Earnings
INSERT INTO salary_components (component_name, component_type, description, status) VALUES
('Housing Allowance', 'earning', 'Monthly housing allowance for employees', 'active'),
('Transport Allowance', 'earning', 'Transportation reimbursement', 'active'),
('Medical Allowance', 'earning', 'Medical and health benefits', 'active'),
('Meal Allowance', 'earning', 'Daily meal subsidy', 'active'),
('Performance Bonus', 'earning', 'Performance-based bonus payment', 'active'),
('Overtime Pay', 'earning', 'Additional pay for overtime work', 'active');

-- Insert Deductions (including taxes)
INSERT INTO salary_components (component_name, component_type, description, status) VALUES
('Income Tax', 'deduction', 'Government income tax deduction', 'active'),
('SSNIT (Tier 1)', 'deduction', 'Social Security contribution - 5.5% employee share', 'active'),
('SSNIT (Tier 2)', 'deduction', 'Provident fund contribution - 5% employee share', 'active'),
('Health Insurance', 'deduction', 'National Health Insurance Scheme (NHIS)', 'active'),
('Loan Repayment', 'deduction', 'Employee loan deduction', 'active'),
('Advance Salary', 'deduction', 'Advance salary recovery', 'active'),
('Pension Contribution', 'deduction', 'Voluntary pension scheme contribution', 'active');

-- Verify insertion
SELECT 
    id,
    component_name,
    component_type,
    description,
    status
FROM salary_components
ORDER BY component_type, component_name;
