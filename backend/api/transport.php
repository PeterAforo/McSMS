<?php
/**
 * Transport Management API
 * Complete transport system with GPS tracking, routes, vehicles, drivers
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // VEHICLES
    // ============================================
    if ($resource === 'vehicles') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE id = ?");
                    $stmt->execute([$id]);
                    $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get maintenance history
                    $stmt = $pdo->prepare("
                        SELECT * FROM vehicle_maintenance 
                        WHERE vehicle_id = ? 
                        ORDER BY maintenance_date DESC 
                        LIMIT 10
                    ");
                    $stmt->execute([$id]);
                    $vehicle['maintenance_history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'vehicle' => $vehicle]);
                } else {
                    $where = [];
                    $params = [];
                    
                    if (!empty($_GET['status'])) {
                        $where[] = "status = ?";
                        $params[] = $_GET['status'];
                    }
                    
                    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            v.*,
                            (SELECT COUNT(*) FROM vehicle_assignments WHERE vehicle_id = v.id AND assignment_date = CURDATE()) as today_assignments
                        FROM vehicles v
                        $whereClause
                        ORDER BY v.vehicle_number
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'vehicles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO vehicles 
                    (vehicle_number, vehicle_type, make, model, year, capacity, registration_number, 
                     insurance_expiry, fitness_certificate_expiry, fuel_type, status, purchase_date, purchase_cost, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['vehicle_number'],
                    $data['vehicle_type'] ?? 'bus',
                    $data['make'] ?? null,
                    $data['model'] ?? null,
                    $data['year'] ?? null,
                    $data['capacity'],
                    $data['registration_number'] ?? null,
                    $data['insurance_expiry'] ?? null,
                    $data['fitness_certificate_expiry'] ?? null,
                    $data['fuel_type'] ?? 'diesel',
                    $data['status'] ?? 'active',
                    $data['purchase_date'] ?? null,
                    $data['purchase_cost'] ?? null,
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE vehicles 
                    SET vehicle_type = ?, make = ?, model = ?, year = ?, capacity = ?, 
                        registration_number = ?, insurance_expiry = ?, fitness_certificate_expiry = ?, 
                        fuel_type = ?, status = ?, notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['vehicle_type'] ?? 'bus',
                    $data['make'] ?? null,
                    $data['model'] ?? null,
                    $data['year'] ?? null,
                    $data['capacity'],
                    $data['registration_number'] ?? null,
                    $data['insurance_expiry'] ?? null,
                    $data['fitness_certificate_expiry'] ?? null,
                    $data['fuel_type'] ?? 'diesel',
                    $data['status'] ?? 'active',
                    $data['notes'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // DRIVERS
    // ============================================
    elseif ($resource === 'drivers') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM drivers WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'driver' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $stmt = $pdo->query("
                        SELECT 
                            d.*,
                            (SELECT COUNT(*) FROM vehicle_assignments WHERE driver_id = d.id AND assignment_date = CURDATE()) as today_assignments
                        FROM drivers d
                        ORDER BY d.driver_name
                    ");
                    echo json_encode(['success' => true, 'drivers' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO drivers 
                    (driver_name, phone, email, license_number, license_expiry, date_of_birth, 
                     address, emergency_contact_name, emergency_contact_phone, hire_date, salary, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['driver_name'],
                    $data['phone'],
                    $data['email'] ?? null,
                    $data['license_number'],
                    $data['license_expiry'],
                    $data['date_of_birth'] ?? null,
                    $data['address'] ?? null,
                    $data['emergency_contact_name'] ?? null,
                    $data['emergency_contact_phone'] ?? null,
                    $data['hire_date'] ?? null,
                    $data['salary'] ?? null,
                    $data['status'] ?? 'active',
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE drivers 
                    SET driver_name = ?, phone = ?, email = ?, license_expiry = ?, 
                        address = ?, emergency_contact_name = ?, emergency_contact_phone = ?, 
                        salary = ?, status = ?, notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['driver_name'],
                    $data['phone'],
                    $data['email'] ?? null,
                    $data['license_expiry'],
                    $data['address'] ?? null,
                    $data['emergency_contact_name'] ?? null,
                    $data['emergency_contact_phone'] ?? null,
                    $data['salary'] ?? null,
                    $data['status'] ?? 'active',
                    $data['notes'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ROUTES
    // ============================================
    elseif ($resource === 'routes') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM transport_routes WHERE id = ?");
                    $stmt->execute([$id]);
                    $route = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get stops
                    $stmt = $pdo->prepare("
                        SELECT * FROM route_stops 
                        WHERE route_id = ? 
                        ORDER BY stop_order
                    ");
                    $stmt->execute([$id]);
                    $route['stops'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Get student count
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count 
                        FROM student_transport 
                        WHERE route_id = ? AND status = 'active'
                    ");
                    $stmt->execute([$id]);
                    $route['student_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    
                    echo json_encode(['success' => true, 'route' => $route]);
                } else {
                    $stmt = $pdo->query("
                        SELECT 
                            r.*,
                            (SELECT COUNT(*) FROM student_transport WHERE route_id = r.id AND status = 'active') as student_count,
                            (SELECT COUNT(*) FROM route_stops WHERE route_id = r.id) as stop_count
                        FROM transport_routes r
                        ORDER BY r.route_name
                    ");
                    echo json_encode(['success' => true, 'routes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO transport_routes 
                    (route_name, route_code, start_location, end_location, total_distance, 
                     estimated_duration, fare_amount, status, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['route_name'],
                    $data['route_code'],
                    $data['start_location'],
                    $data['end_location'],
                    $data['total_distance'] ?? null,
                    $data['estimated_duration'] ?? null,
                    $data['fare_amount'],
                    $data['status'] ?? 'active',
                    $data['description'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE transport_routes 
                    SET route_name = ?, start_location = ?, end_location = ?, total_distance = ?, 
                        estimated_duration = ?, fare_amount = ?, status = ?, description = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['route_name'],
                    $data['start_location'],
                    $data['end_location'],
                    $data['total_distance'] ?? null,
                    $data['estimated_duration'] ?? null,
                    $data['fare_amount'],
                    $data['status'] ?? 'active',
                    $data['description'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ASSIGNMENTS
    // ============================================
    elseif ($resource === 'assignments') {
        switch ($method) {
            case 'GET':
                if ($action === 'today') {
                    $stmt = $pdo->query("
                        SELECT 
                            va.*,
                            v.vehicle_number,
                            v.vehicle_type,
                            d.driver_name,
                            d.phone as driver_phone,
                            r.route_name,
                            r.route_code,
                            (SELECT COUNT(*) FROM student_transport WHERE route_id = va.route_id AND status = 'active') as student_count
                        FROM vehicle_assignments va
                        JOIN vehicles v ON va.vehicle_id = v.id
                        JOIN drivers d ON va.driver_id = d.id
                        JOIN transport_routes r ON va.route_id = r.id
                        WHERE va.assignment_date = CURDATE()
                        ORDER BY va.start_time
                    ");
                    echo json_encode(['success' => true, 'assignments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_date') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $stmt = $pdo->prepare("
                        SELECT 
                            va.*,
                            v.vehicle_number,
                            d.driver_name,
                            r.route_name
                        FROM vehicle_assignments va
                        JOIN vehicles v ON va.vehicle_id = v.id
                        JOIN drivers d ON va.driver_id = d.id
                        JOIN transport_routes r ON va.route_id = r.id
                        WHERE va.assignment_date = ?
                        ORDER BY va.start_time
                    ");
                    $stmt->execute([$date]);
                    echo json_encode(['success' => true, 'assignments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO vehicle_assignments 
                    (vehicle_id, driver_id, route_id, assignment_date, shift, start_time, end_time, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['vehicle_id'],
                    $data['driver_id'],
                    $data['route_id'],
                    $data['assignment_date'],
                    $data['shift'] ?? 'both',
                    $data['start_time'] ?? null,
                    $data['end_time'] ?? null,
                    $data['status'] ?? 'scheduled',
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'update_status') {
                    $stmt = $pdo->prepare("UPDATE vehicle_assignments SET status = ? WHERE id = ?");
                    $stmt->execute([$data['status'], $id]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE vehicle_assignments 
                        SET vehicle_id = ?, driver_id = ?, route_id = ?, shift = ?, 
                            start_time = ?, end_time = ?, status = ?, notes = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['vehicle_id'],
                        $data['driver_id'],
                        $data['route_id'],
                        $data['shift'] ?? 'both',
                        $data['start_time'] ?? null,
                        $data['end_time'] ?? null,
                        $data['status'] ?? 'scheduled',
                        $data['notes'] ?? null,
                        $id
                    ]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // STUDENT TRANSPORT
    // ============================================
    elseif ($resource === 'student_transport') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_route') {
                    $routeId = $_GET['route_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            st.*,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.student_id as student_number,
                            c.class_name,
                            rs.stop_name
                        FROM student_transport st
                        JOIN students s ON st.student_id = s.id
                        JOIN classes c ON s.class_id = c.id
                        JOIN route_stops rs ON st.stop_id = rs.id
                        WHERE st.route_id = ? AND st.status = 'active'
                        ORDER BY rs.stop_order, s.first_name
                    ");
                    $stmt->execute([$routeId]);
                    echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_student') {
                    $studentId = $_GET['student_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            st.*,
                            r.route_name,
                            r.route_code,
                            rs.stop_name
                        FROM student_transport st
                        JOIN transport_routes r ON st.route_id = r.id
                        JOIN route_stops rs ON st.stop_id = rs.id
                        WHERE st.student_id = ?
                        ORDER BY st.start_date DESC
                    ");
                    $stmt->execute([$studentId]);
                    echo json_encode(['success' => true, 'transport' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO student_transport 
                    (student_id, route_id, stop_id, pickup_time, drop_time, fare_amount, 
                     start_date, end_date, status, parent_contact, special_instructions)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['student_id'],
                    $data['route_id'],
                    $data['stop_id'],
                    $data['pickup_time'] ?? null,
                    $data['drop_time'] ?? null,
                    $data['fare_amount'],
                    $data['start_date'],
                    $data['end_date'] ?? null,
                    $data['status'] ?? 'active',
                    $data['parent_contact'] ?? null,
                    $data['special_instructions'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE student_transport 
                    SET stop_id = ?, pickup_time = ?, drop_time = ?, fare_amount = ?, 
                        end_date = ?, status = ?, special_instructions = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['stop_id'],
                    $data['pickup_time'] ?? null,
                    $data['drop_time'] ?? null,
                    $data['fare_amount'],
                    $data['end_date'] ?? null,
                    $data['status'] ?? 'active',
                    $data['special_instructions'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // GPS TRACKING
    // ============================================
    elseif ($resource === 'tracking') {
        switch ($method) {
            case 'GET':
                if ($action === 'live') {
                    // Get latest position for all active vehicles
                    $stmt = $pdo->query("
                        SELECT 
                            v.id,
                            v.vehicle_number,
                            v.vehicle_type,
                            vt.latitude,
                            vt.longitude,
                            vt.speed,
                            vt.status,
                            vt.timestamp,
                            va.route_id,
                            r.route_name,
                            d.driver_name
                        FROM vehicles v
                        LEFT JOIN vehicle_tracking vt ON v.id = vt.vehicle_id
                        LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id AND va.assignment_date = CURDATE()
                        LEFT JOIN transport_routes r ON va.route_id = r.id
                        LEFT JOIN drivers d ON va.driver_id = d.id
                        WHERE v.status = 'active'
                        AND vt.id IN (
                            SELECT MAX(id) FROM vehicle_tracking GROUP BY vehicle_id
                        )
                        ORDER BY v.vehicle_number
                    ");
                    echo json_encode(['success' => true, 'vehicles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'history') {
                    $vehicleId = $_GET['vehicle_id'] ?? null;
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $stmt = $pdo->prepare("
                        SELECT * FROM vehicle_tracking 
                        WHERE vehicle_id = ? AND DATE(timestamp) = ?
                        ORDER BY timestamp
                    ");
                    $stmt->execute([$vehicleId, $date]);
                    echo json_encode(['success' => true, 'history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO vehicle_tracking 
                    (vehicle_id, assignment_id, latitude, longitude, speed, heading, timestamp, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['vehicle_id'],
                    $data['assignment_id'] ?? null,
                    $data['latitude'],
                    $data['longitude'],
                    $data['speed'] ?? null,
                    $data['heading'] ?? null,
                    $data['timestamp'] ?? date('Y-m-d H:i:s'),
                    $data['status'] ?? 'moving'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

    // ============================================
    // MAINTENANCE
    // ============================================
    elseif ($resource === 'maintenance') {
        switch ($method) {
            case 'GET':
                if ($action === 'upcoming') {
                    $stmt = $pdo->query("
                        SELECT 
                            vm.*,
                            v.vehicle_number
                        FROM vehicle_maintenance vm
                        JOIN vehicles v ON vm.vehicle_id = v.id
                        WHERE vm.status IN ('scheduled', 'in_progress')
                        AND vm.maintenance_date >= CURDATE()
                        ORDER BY vm.maintenance_date
                    ");
                    echo json_encode(['success' => true, 'maintenance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_vehicle') {
                    $vehicleId = $_GET['vehicle_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT * FROM vehicle_maintenance 
                        WHERE vehicle_id = ? 
                        ORDER BY maintenance_date DESC
                    ");
                    $stmt->execute([$vehicleId]);
                    echo json_encode(['success' => true, 'maintenance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO vehicle_maintenance 
                    (vehicle_id, maintenance_type, description, maintenance_date, cost, 
                     odometer_reading, service_provider, next_service_date, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['vehicle_id'],
                    $data['maintenance_type'] ?? 'routine',
                    $data['description'],
                    $data['maintenance_date'],
                    $data['cost'] ?? null,
                    $data['odometer_reading'] ?? null,
                    $data['service_provider'] ?? null,
                    $data['next_service_date'] ?? null,
                    $data['status'] ?? 'scheduled',
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE vehicle_maintenance 
                    SET maintenance_type = ?, description = ?, maintenance_date = ?, cost = ?, 
                        odometer_reading = ?, service_provider = ?, next_service_date = ?, status = ?, notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['maintenance_type'] ?? 'routine',
                    $data['description'],
                    $data['maintenance_date'],
                    $data['cost'] ?? null,
                    $data['odometer_reading'] ?? null,
                    $data['service_provider'] ?? null,
                    $data['next_service_date'] ?? null,
                    $data['status'] ?? 'scheduled',
                    $data['notes'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // FUEL RECORDS
    // ============================================
    elseif ($resource === 'fuel') {
        switch ($method) {
            case 'GET':
                $where = [];
                $params = [];
                
                if (!empty($_GET['date_from'])) {
                    $where[] = "f.fuel_date >= ?";
                    $params[] = $_GET['date_from'];
                }
                if (!empty($_GET['date_to'])) {
                    $where[] = "f.fuel_date <= ?";
                    $params[] = $_GET['date_to'];
                }
                if (!empty($_GET['vehicle_id'])) {
                    $where[] = "f.vehicle_id = ?";
                    $params[] = $_GET['vehicle_id'];
                }
                
                $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                
                $stmt = $pdo->prepare("
                    SELECT f.*, v.vehicle_number
                    FROM fuel_records f
                    JOIN vehicles v ON f.vehicle_id = v.id
                    $whereClause
                    ORDER BY f.fuel_date DESC
                    LIMIT 100
                ");
                $stmt->execute($params);
                echo json_encode(['success' => true, 'fuel_records' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO fuel_records 
                    (vehicle_id, fuel_date, liters, cost_per_liter, total_cost, odometer_reading, fuel_station, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['vehicle_id'],
                    $data['fuel_date'],
                    $data['liters'],
                    $data['cost_per_liter'],
                    $data['total_cost'],
                    $data['odometer_reading'] ?? null,
                    $data['fuel_station'] ?? null,
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

    // ============================================
    // TRIP HISTORY
    // ============================================
    elseif ($resource === 'trip_history') {
        $where = [];
        $params = [];
        
        if (!empty($_GET['date_from'])) {
            $where[] = "a.assignment_date >= ?";
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where[] = "a.assignment_date <= ?";
            $params[] = $_GET['date_to'];
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmt = $pdo->prepare("
            SELECT 
                a.id,
                a.assignment_date as trip_date,
                v.vehicle_number,
                d.driver_name,
                r.route_name,
                a.start_time,
                a.end_time,
                a.shift,
                a.status,
                (SELECT COUNT(*) FROM student_transport st WHERE st.route_id = a.route_id) as students_count
            FROM vehicle_assignments a
            JOIN vehicles v ON a.vehicle_id = v.id
            JOIN drivers d ON a.driver_id = d.id
            JOIN transport_routes r ON a.route_id = r.id
            $whereClause
            ORDER BY a.assignment_date DESC, a.start_time DESC
            LIMIT 100
        ");
        $stmt->execute($params);
        echo json_encode(['success' => true, 'trips' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // ============================================
    // PICKUP TRACKING
    // ============================================
    elseif ($resource === 'pickup_tracking') {
        switch ($method) {
            case 'GET':
                $date = $_GET['date'] ?? date('Y-m-d');
                $stmt = $pdo->prepare("
                    SELECT 
                        st.id,
                        st.student_id,
                        CONCAT(s.first_name, ' ', s.last_name) as student_name,
                        r.route_name,
                        st.stop_name,
                        pt.morning_status,
                        pt.morning_time,
                        pt.afternoon_status,
                        pt.afternoon_time
                    FROM student_transport st
                    JOIN students s ON st.student_id = s.id
                    JOIN transport_routes r ON st.route_id = r.id
                    LEFT JOIN pickup_tracking pt ON pt.student_id = st.student_id AND pt.tracking_date = ?
                    WHERE s.status = 'active'
                    ORDER BY r.route_name, st.stop_order
                ");
                $stmt->execute([$date]);
                echo json_encode(['success' => true, 'tracking' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $date = $data['date'] ?? date('Y-m-d');
                $status = $data['status'];
                $studentId = $data['student_id'];
                
                // Check if record exists
                $stmt = $pdo->prepare("SELECT id FROM pickup_tracking WHERE student_id = ? AND tracking_date = ?");
                $stmt->execute([$studentId, $date]);
                $existing = $stmt->fetch();
                
                $hour = (int)date('H');
                $column = $hour < 12 ? 'morning' : 'afternoon';
                
                if ($existing) {
                    $stmt = $pdo->prepare("UPDATE pickup_tracking SET {$column}_status = ?, {$column}_time = NOW() WHERE id = ?");
                    $stmt->execute([$status, $existing['id']]);
                } else {
                    $stmt = $pdo->prepare("INSERT INTO pickup_tracking (student_id, tracking_date, {$column}_status, {$column}_time) VALUES (?, ?, ?, NOW())");
                    $stmt->execute([$studentId, $date, $status]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // TRANSPORT FEES
    // ============================================
    elseif ($resource === 'transport_fees') {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->query("
                    SELECT 
                        tf.id,
                        tf.student_id,
                        CONCAT(s.first_name, ' ', s.last_name) as student_name,
                        r.route_name,
                        tf.amount,
                        tf.term,
                        tf.status,
                        tf.created_at
                    FROM transport_fees tf
                    JOIN students s ON tf.student_id = s.id
                    JOIN transport_routes r ON tf.route_id = r.id
                    ORDER BY tf.created_at DESC
                ");
                echo json_encode(['success' => true, 'fees' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO transport_fees (student_id, route_id, amount, term, status)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['student_id'],
                    $data['route_id'],
                    $data['amount'],
                    $data['term'],
                    $data['status'] ?? 'pending'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE transport_fees SET status = ? WHERE id = ?");
                $stmt->execute([$data['status'], $id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // EXPENSES
    // ============================================
    elseif ($resource === 'expenses') {
        switch ($method) {
            case 'GET':
                $where = [];
                $params = [];
                
                if (!empty($_GET['date_from'])) {
                    $where[] = "e.expense_date >= ?";
                    $params[] = $_GET['date_from'];
                }
                if (!empty($_GET['date_to'])) {
                    $where[] = "e.expense_date <= ?";
                    $params[] = $_GET['date_to'];
                }
                if (!empty($_GET['category'])) {
                    $where[] = "e.category = ?";
                    $params[] = $_GET['category'];
                }
                
                $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                
                $stmt = $pdo->prepare("
                    SELECT e.*, v.vehicle_number
                    FROM transport_expenses e
                    LEFT JOIN vehicles v ON e.vehicle_id = v.id
                    $whereClause
                    ORDER BY e.expense_date DESC
                    LIMIT 100
                ");
                $stmt->execute($params);
                echo json_encode(['success' => true, 'expenses' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO transport_expenses (category, vehicle_id, description, amount, expense_date)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['category'],
                    $data['vehicle_id'] ?: null,
                    $data['description'],
                    $data['amount'],
                    $data['expense_date']
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    elseif ($resource === 'notifications') {
        $data = json_decode(file_get_contents('php://input'), true);
        // Log notification (actual sending would require SMS/WhatsApp integration)
        $stmt = $pdo->prepare("
            INSERT INTO transport_notifications (student_id, message, notification_type, sent_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([
            $data['student_id'],
            $data['message'],
            $data['type'] ?? 'transport'
        ]);
        echo json_encode(['success' => true, 'message' => 'Notification logged']);
    }

    // ============================================
    // GPS TRACKING
    // ============================================
    elseif ($resource === 'gps') {
        // Create GPS tracking table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS vehicle_gps_tracking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                speed DECIMAL(5, 2) DEFAULT 0,
                heading DECIMAL(5, 2) DEFAULT 0,
                accuracy DECIMAL(6, 2) DEFAULT 0,
                altitude DECIMAL(8, 2) DEFAULT 0,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_vehicle_id (vehicle_id),
                INDEX idx_recorded_at (recorded_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Create ETA tracking table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS vehicle_eta (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT NOT NULL,
                stop_id INT NOT NULL,
                estimated_arrival DATETIME,
                actual_arrival DATETIME,
                status ENUM('pending', 'approaching', 'arrived', 'departed') DEFAULT 'pending',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_vehicle_stop (vehicle_id, stop_id),
                INDEX idx_vehicle_id (vehicle_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        switch ($method) {
            case 'GET':
                if ($action === 'live') {
                    // Get live location of all active vehicles
                    $stmt = $pdo->query("
                        SELECT v.id, v.vehicle_number, v.vehicle_name, v.status,
                               g.latitude, g.longitude, g.speed, g.heading, g.recorded_at,
                               d.first_name as driver_first_name, d.last_name as driver_last_name, d.phone as driver_phone,
                               r.route_name
                        FROM vehicles v
                        LEFT JOIN (
                            SELECT vehicle_id, latitude, longitude, speed, heading, recorded_at
                            FROM vehicle_gps_tracking
                            WHERE (vehicle_id, recorded_at) IN (
                                SELECT vehicle_id, MAX(recorded_at) FROM vehicle_gps_tracking GROUP BY vehicle_id
                            )
                        ) g ON v.id = g.vehicle_id
                        LEFT JOIN drivers d ON v.driver_id = d.id
                        LEFT JOIN routes r ON v.route_id = r.id
                        WHERE v.status = 'active'
                    ");
                    echo json_encode(['success' => true, 'vehicles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'history') {
                    // Get GPS history for a vehicle
                    $vehicleId = $_GET['vehicle_id'] ?? null;
                    $date = $_GET['date'] ?? date('Y-m-d');
                    
                    $stmt = $pdo->prepare("
                        SELECT latitude, longitude, speed, heading, recorded_at
                        FROM vehicle_gps_tracking
                        WHERE vehicle_id = ? AND DATE(recorded_at) = ?
                        ORDER BY recorded_at ASC
                    ");
                    $stmt->execute([$vehicleId, $date]);
                    echo json_encode(['success' => true, 'history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'eta') {
                    // Get ETA for a vehicle's stops
                    $vehicleId = $_GET['vehicle_id'] ?? null;
                    
                    $stmt = $pdo->prepare("
                        SELECT e.*, s.stop_name, s.latitude as stop_lat, s.longitude as stop_lng
                        FROM vehicle_eta e
                        JOIN route_stops s ON e.stop_id = s.id
                        WHERE e.vehicle_id = ?
                        ORDER BY e.estimated_arrival ASC
                    ");
                    $stmt->execute([$vehicleId]);
                    echo json_encode(['success' => true, 'eta' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    // Get current location of specific vehicle
                    $stmt = $pdo->prepare("
                        SELECT v.*, g.latitude, g.longitude, g.speed, g.heading, g.recorded_at
                        FROM vehicles v
                        LEFT JOIN (
                            SELECT * FROM vehicle_gps_tracking WHERE vehicle_id = ? ORDER BY recorded_at DESC LIMIT 1
                        ) g ON v.id = g.vehicle_id
                        WHERE v.id = ?
                    ");
                    $stmt->execute([$id, $id]);
                    echo json_encode(['success' => true, 'vehicle' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'update_location') {
                    // Update vehicle location (from driver app or GPS device)
                    $stmt = $pdo->prepare("
                        INSERT INTO vehicle_gps_tracking 
                        (vehicle_id, latitude, longitude, speed, heading, accuracy, altitude)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['vehicle_id'],
                        $data['latitude'],
                        $data['longitude'],
                        $data['speed'] ?? 0,
                        $data['heading'] ?? 0,
                        $data['accuracy'] ?? 0,
                        $data['altitude'] ?? 0
                    ]);
                    
                    // Calculate and update ETAs
                    updateVehicleETAs($pdo, $data['vehicle_id'], $data['latitude'], $data['longitude']);
                    
                    echo json_encode(['success' => true, 'message' => 'Location updated']);
                    
                } elseif ($action === 'check_in') {
                    // Student check-in/check-out
                    $pdo->exec("
                        CREATE TABLE IF NOT EXISTS student_transport_log (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            student_id INT NOT NULL,
                            vehicle_id INT NOT NULL,
                            action ENUM('board', 'alight') NOT NULL,
                            latitude DECIMAL(10, 8),
                            longitude DECIMAL(11, 8),
                            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            verified_by VARCHAR(100),
                            INDEX idx_student_id (student_id),
                            INDEX idx_recorded_at (recorded_at)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    ");
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO student_transport_log 
                        (student_id, vehicle_id, action, latitude, longitude, verified_by)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['student_id'],
                        $data['vehicle_id'],
                        $data['action'],
                        $data['latitude'] ?? null,
                        $data['longitude'] ?? null,
                        $data['verified_by'] ?? null
                    ]);
                    
                    // Send notification to parent
                    $actionText = $data['action'] === 'board' ? 'boarded' : 'alighted from';
                    notifyParent($pdo, $data['student_id'], "Your child has $actionText the school bus.");
                    
                    echo json_encode(['success' => true, 'message' => 'Check-in recorded']);
                    
                } elseif ($action === 'geofence_alert') {
                    // Handle geofence alerts (approaching school, etc.)
                    $pdo->exec("
                        CREATE TABLE IF NOT EXISTS geofence_alerts (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            vehicle_id INT NOT NULL,
                            geofence_type VARCHAR(50),
                            alert_type ENUM('enter', 'exit') NOT NULL,
                            latitude DECIMAL(10, 8),
                            longitude DECIMAL(11, 8),
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_vehicle_id (vehicle_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    ");
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO geofence_alerts (vehicle_id, geofence_type, alert_type, latitude, longitude)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['vehicle_id'],
                        $data['geofence_type'],
                        $data['alert_type'],
                        $data['latitude'],
                        $data['longitude']
                    ]);
                    
                    // Notify relevant parties
                    if ($data['geofence_type'] === 'school' && $data['alert_type'] === 'enter') {
                        // Bus is approaching school
                        notifySchoolArrival($pdo, $data['vehicle_id']);
                    }
                    
                    echo json_encode(['success' => true, 'message' => 'Geofence alert recorded']);
                }
                break;
        }
    }

    // ============================================
    // ROUTE OPTIMIZATION
    // ============================================
    elseif ($resource === 'optimize') {
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $routeId = $data['route_id'] ?? null;
            
            if (!$routeId) {
                echo json_encode(['success' => false, 'error' => 'Route ID required']);
                exit;
            }
            
            // Get all stops for this route
            $stmt = $pdo->prepare("
                SELECT id, stop_name, latitude, longitude, stop_order
                FROM route_stops
                WHERE route_id = ?
                ORDER BY stop_order
            ");
            $stmt->execute([$routeId]);
            $stops = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Simple optimization: Calculate distances and suggest optimal order
            // In production, you would use a proper routing API like Google Directions
            $optimizedStops = optimizeRouteOrder($stops);
            
            echo json_encode([
                'success' => true,
                'original_stops' => $stops,
                'optimized_stops' => $optimizedStops,
                'estimated_savings' => '15%' // Placeholder
            ]);
        }
    }

    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid resource']);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// Helper functions for GPS tracking

function updateVehicleETAs($pdo, $vehicleId, $currentLat, $currentLng) {
    try {
        // Get vehicle's route stops
        $stmt = $pdo->prepare("
            SELECT rs.id, rs.stop_name, rs.latitude, rs.longitude, rs.stop_order
            FROM route_stops rs
            JOIN vehicles v ON rs.route_id = v.route_id
            WHERE v.id = ?
            ORDER BY rs.stop_order
        ");
        $stmt->execute([$vehicleId]);
        $stops = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($stops as $stop) {
            // Calculate distance to stop
            $distance = calculateDistance($currentLat, $currentLng, $stop['latitude'], $stop['longitude']);
            
            // Estimate time (assuming average speed of 30 km/h in traffic)
            $avgSpeed = 30; // km/h
            $timeMinutes = ($distance / $avgSpeed) * 60;
            
            $estimatedArrival = date('Y-m-d H:i:s', strtotime("+{$timeMinutes} minutes"));
            
            // Determine status
            $status = 'pending';
            if ($distance < 0.5) {
                $status = 'approaching';
            } elseif ($distance < 0.1) {
                $status = 'arrived';
            }
            
            // Update or insert ETA
            $stmt = $pdo->prepare("
                INSERT INTO vehicle_eta (vehicle_id, stop_id, estimated_arrival, status)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    estimated_arrival = VALUES(estimated_arrival),
                    status = VALUES(status)
            ");
            $stmt->execute([$vehicleId, $stop['id'], $estimatedArrival, $status]);
        }
    } catch (Exception $e) {
        error_log("ETA update error: " . $e->getMessage());
    }
}

function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    // Haversine formula
    $earthRadius = 6371; // km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    
    return $earthRadius * $c;
}

function notifyParent($pdo, $studentId, $message) {
    try {
        // Get parent user ID
        $stmt = $pdo->prepare("
            SELECT u.id as parent_user_id
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['parent_user_id']) {
            // Create notification
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, 'Transport Update', ?, 'transport', 0, NOW())
            ");
            $stmt->execute([$result['parent_user_id'], $message]);
        }
    } catch (Exception $e) {
        error_log("Parent notification error: " . $e->getMessage());
    }
}

function notifySchoolArrival($pdo, $vehicleId) {
    try {
        // Get all students on this vehicle's route
        $stmt = $pdo->prepare("
            SELECT s.id, s.first_name, s.last_name, u.id as parent_user_id
            FROM students s
            JOIN student_transport st ON s.id = st.student_id
            JOIN vehicles v ON st.route_id = v.route_id
            LEFT JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE v.id = ?
        ");
        $stmt->execute([$vehicleId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($students as $student) {
            if ($student['parent_user_id']) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (?, 'Bus Arriving', ?, 'transport', 0, NOW())
                ");
                $message = "The school bus carrying {$student['first_name']} is approaching the school.";
                $stmt->execute([$student['parent_user_id'], $message]);
            }
        }
    } catch (Exception $e) {
        error_log("School arrival notification error: " . $e->getMessage());
    }
}

function optimizeRouteOrder($stops) {
    if (count($stops) <= 2) {
        return $stops;
    }
    
    // Simple nearest neighbor algorithm
    $optimized = [];
    $remaining = $stops;
    
    // Start with first stop
    $current = array_shift($remaining);
    $optimized[] = $current;
    
    while (count($remaining) > 0) {
        $nearestIndex = 0;
        $nearestDistance = PHP_FLOAT_MAX;
        
        foreach ($remaining as $index => $stop) {
            $distance = calculateDistance(
                $current['latitude'], $current['longitude'],
                $stop['latitude'], $stop['longitude']
            );
            
            if ($distance < $nearestDistance) {
                $nearestDistance = $distance;
                $nearestIndex = $index;
            }
        }
        
        $current = $remaining[$nearestIndex];
        $optimized[] = $current;
        array_splice($remaining, $nearestIndex, 1);
    }
    
    // Update stop_order
    foreach ($optimized as $index => &$stop) {
        $stop['stop_order'] = $index + 1;
    }
    
    return $optimized;
}
