-- Transport Management System Tables

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type ENUM('bus', 'van', 'car', 'minibus') DEFAULT 'bus',
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    capacity INT NOT NULL,
    registration_number VARCHAR(50),
    insurance_expiry DATE,
    fitness_certificate_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') DEFAULT 'diesel',
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_vehicle_number (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    hire_date DATE,
    salary DECIMAL(10,2),
    status ENUM('active', 'on_leave', 'suspended', 'inactive') DEFAULT 'active',
    photo_path VARCHAR(255),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_license (license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Routes
CREATE TABLE IF NOT EXISTS transport_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(50) UNIQUE NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    total_distance DECIMAL(10,2),
    estimated_duration INT COMMENT 'Duration in minutes',
    fare_amount DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_route_code (route_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Route stops
CREATE TABLE IF NOT EXISTS route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INT NOT NULL,
    arrival_time TIME,
    distance_from_previous DECIMAL(10,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    landmark TEXT,
    FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
    INDEX idx_route (route_id),
    INDEX idx_order (stop_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vehicle assignments
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    route_id INT NOT NULL,
    assignment_date DATE NOT NULL,
    shift ENUM('morning', 'afternoon', 'both') DEFAULT 'both',
    start_time TIME,
    end_time TIME,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (route_id) REFERENCES transport_routes(id),
    INDEX idx_date (assignment_date),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_driver (driver_id),
    INDEX idx_route (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student transport
CREATE TABLE IF NOT EXISTS student_transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    pickup_time TIME,
    drop_time TIME,
    fare_amount DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
    parent_contact VARCHAR(20),
    special_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (route_id) REFERENCES transport_routes(id),
    FOREIGN KEY (stop_id) REFERENCES route_stops(id),
    INDEX idx_student (student_id),
    INDEX idx_route (route_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transport attendance
CREATE TABLE IF NOT EXISTS transport_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_transport_id INT NOT NULL,
    assignment_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    pickup_status ENUM('present', 'absent', 'late', 'not_required') DEFAULT 'present',
    pickup_time TIME,
    drop_status ENUM('present', 'absent', 'early', 'not_required') DEFAULT 'present',
    drop_time TIME,
    marked_by INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_transport_id) REFERENCES student_transport(id),
    FOREIGN KEY (assignment_id) REFERENCES vehicle_assignments(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_attendance (student_transport_id, attendance_date),
    INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vehicle maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    maintenance_type ENUM('routine', 'repair', 'inspection', 'emergency') DEFAULT 'routine',
    description TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10,2),
    odometer_reading INT,
    service_provider VARCHAR(255),
    next_service_date DATE,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    performed_by VARCHAR(255),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_date (maintenance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fuel logs
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT,
    fuel_date DATE NOT NULL,
    fuel_quantity DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    odometer_reading INT,
    fuel_station VARCHAR(255),
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_date (fuel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- GPS tracking
CREATE TABLE IF NOT EXISTS vehicle_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    assignment_id INT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading INT,
    timestamp DATETIME NOT NULL,
    status ENUM('moving', 'stopped', 'idle') DEFAULT 'moving',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (assignment_id) REFERENCES vehicle_assignments(id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transport fees
CREATE TABLE IF NOT EXISTS transport_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_transport_id INT NOT NULL,
    invoice_id INT,
    fee_month VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'waived') DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    payment_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_transport_id) REFERENCES student_transport(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    UNIQUE KEY unique_fee (student_transport_id, fee_month),
    INDEX idx_status (status),
    INDEX idx_month (fee_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Incidents/Accidents
CREATE TABLE IF NOT EXISTS transport_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT,
    assignment_id INT,
    incident_date DATETIME NOT NULL,
    incident_type ENUM('accident', 'breakdown', 'delay', 'complaint', 'other') NOT NULL,
    severity ENUM('minor', 'moderate', 'major', 'critical') DEFAULT 'minor',
    description TEXT NOT NULL,
    location VARCHAR(255),
    injuries BOOLEAN DEFAULT FALSE,
    police_report BOOLEAN DEFAULT FALSE,
    report_number VARCHAR(100),
    estimated_cost DECIMAL(10,2),
    status ENUM('reported', 'investigating', 'resolved', 'closed') DEFAULT 'reported',
    reported_by INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (assignment_id) REFERENCES vehicle_assignments(id),
    FOREIGN KEY (reported_by) REFERENCES users(id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_date (incident_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample data
INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, year, capacity, status) VALUES
('BUS-001', 'bus', 'Toyota', 'Coaster', 2020, 30, 'active'),
('BUS-002', 'bus', 'Mercedes', 'Sprinter', 2019, 25, 'active'),
('VAN-001', 'van', 'Toyota', 'Hiace', 2021, 15, 'active')
ON DUPLICATE KEY UPDATE vehicle_number = VALUES(vehicle_number);

INSERT INTO drivers (driver_name, phone, license_number, license_expiry, status) VALUES
('John Mensah', '+233244123456', 'DL-2024-001', '2026-12-31', 'active'),
('Kwame Asante', '+233244123457', 'DL-2024-002', '2027-06-30', 'active'),
('Ama Serwaa', '+233244123458', 'DL-2024-003', '2026-09-30', 'active')
ON DUPLICATE KEY UPDATE driver_name = VALUES(driver_name);

INSERT INTO transport_routes (route_name, route_code, start_location, end_location, total_distance, fare_amount, status) VALUES
('East Route', 'RT-EAST', 'Madina', 'School Campus', 15.5, 150.00, 'active'),
('West Route', 'RT-WEST', 'Dansoman', 'School Campus', 12.0, 120.00, 'active'),
('North Route', 'RT-NORTH', 'Achimota', 'School Campus', 10.0, 100.00, 'active')
ON DUPLICATE KEY UPDATE route_name = VALUES(route_name);
