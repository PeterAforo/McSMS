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

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
