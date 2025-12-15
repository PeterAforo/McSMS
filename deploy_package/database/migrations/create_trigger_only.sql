-- Create auto-increment trigger for employee numbers
-- Run this in phpMyAdmin SQL tab

DROP TRIGGER IF EXISTS before_employee_insert;

DELIMITER //

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    
    IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number, 4) AS UNSIGNED)), 0) + 1 
        INTO next_num
        FROM employees 
        WHERE employee_number REGEXP '^EMP[0-9]+$';
        
        SET NEW.employee_number = CONCAT('EMP', LPAD(next_num, 5, '0'));
    END IF;
END//

DELIMITER ;
