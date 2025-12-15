<?php
/**
 * Advanced Analytics Dashboard API
 * Comprehensive analytics, predictions, and insights
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

    // ============================================
    // OVERVIEW DASHBOARD
    // ============================================
    if ($resource === 'overview') {
        $stmt = $pdo->query("
            SELECT 
                (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
                (SELECT COUNT(*) FROM teachers WHERE status = 'active') as total_teachers,
                (SELECT COUNT(*) FROM classes WHERE status = 'active') as total_classes,
                (SELECT COUNT(*) FROM courses WHERE status = 'published') as total_courses,
                (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE())) as revenue_ytd,
                (SELECT COALESCE(SUM(balance), 0) FROM invoices WHERE balance > 0 AND status NOT IN ('paid', 'cancelled', 'draft')) as overdue_amount,
                (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
                (SELECT COALESCE(AVG(attendance_percentage), 0) FROM (
                    SELECT CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*)) * 100 ELSE 0 END as attendance_percentage
                    FROM attendance 
                    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY date
                ) as daily_attendance) as avg_attendance_30days
        ");
        echo json_encode(['success' => true, 'overview' => $stmt->fetch(PDO::FETCH_ASSOC)]);
    }

    // ============================================
    // STUDENT ANALYTICS
    // ============================================
    elseif ($resource === 'students') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'enrollment_trends') {
            $stmt = $pdo->query("
                SELECT 
                    DATE_FORMAT(admission_date, '%Y-%m') as month,
                    COUNT(*) as count
                FROM students
                WHERE admission_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(admission_date, '%Y-%m')
                ORDER BY month
            ");
            echo json_encode(['success' => true, 'trends' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'by_class') {
            $stmt = $pdo->query("
                SELECT 
                    c.class_name,
                    COUNT(s.id) as student_count,
                    COUNT(CASE WHEN s.gender = 'male' THEN 1 END) as male_count,
                    COUNT(CASE WHEN s.gender = 'female' THEN 1 END) as female_count
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
                GROUP BY c.id, c.class_name
                ORDER BY c.class_name
            ");
            echo json_encode(['success' => true, 'distribution' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'performance') {
            $termId = $_GET['term_id'] ?? null;
            $stmt = $pdo->prepare("
                SELECT 
                    s.id,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    c.class_name,
                    AVG(er.percentage) as avg_percentage,
                    COUNT(er.id) as exam_count,
                    CASE 
                        WHEN AVG(er.percentage) >= 80 THEN 'Excellent'
                        WHEN AVG(er.percentage) >= 60 THEN 'Good'
                        WHEN AVG(er.percentage) >= 40 THEN 'Average'
                        ELSE 'Below Average'
                    END as performance_category
                FROM students s
                JOIN classes c ON s.class_id = c.id
                LEFT JOIN exam_results er ON s.id = er.student_id
                LEFT JOIN exam_schedules es ON er.exam_schedule_id = es.id
                LEFT JOIN exams e ON es.exam_id = e.id
                WHERE s.status = 'active' AND (? IS NULL OR e.term_id = ?)
                GROUP BY s.id
                HAVING exam_count > 0
                ORDER BY avg_percentage DESC
                LIMIT 50
            ");
            $stmt->execute([$termId, $termId]);
            echo json_encode(['success' => true, 'performance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'at_risk') {
            // Students with low performance or poor attendance
            $stmt = $pdo->query("
                SELECT 
                    s.id,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    c.class_name,
                    COALESCE(AVG(er.percentage), 0) as avg_percentage,
                    COALESCE((SELECT CASE WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*) * 100 ELSE 100 END
                     FROM attendance 
                     WHERE student_id = s.id 
                     AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 100) as attendance_rate,
                    CASE 
                        WHEN COALESCE(AVG(er.percentage), 100) < 40 THEN 'Low Performance'
                        WHEN COALESCE((SELECT CASE WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*) * 100 ELSE 100 END
                              FROM attendance 
                              WHERE student_id = s.id 
                              AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 100) < 75 THEN 'Poor Attendance'
                        ELSE 'Multiple Issues'
                    END as risk_reason
                FROM students s
                JOIN classes c ON s.class_id = c.id
                LEFT JOIN exam_results er ON s.id = er.student_id
                WHERE s.status = 'active'
                GROUP BY s.id, s.first_name, s.last_name, c.class_name
                HAVING avg_percentage < 40 OR attendance_rate < 75
                ORDER BY avg_percentage ASC, attendance_rate ASC
                LIMIT 20
            ");
            echo json_encode(['success' => true, 'at_risk_students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // ============================================
    // FINANCIAL ANALYTICS
    // ============================================
    elseif ($resource === 'finance') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'revenue_trends') {
            $stmt = $pdo->query("
                SELECT 
                    DATE_FORMAT(payment_date, '%Y-%m') as month,
                    SUM(amount) as revenue,
                    COUNT(*) as payment_count
                FROM payments
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                ORDER BY month
            ");
            echo json_encode(['success' => true, 'trends' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'collection_rate') {
            $stmt = $pdo->query("
                SELECT 
                    DATE_FORMAT(i.created_at, '%Y-%m') as month,
                    SUM(i.total_amount) as total_billed,
                    SUM(i.paid_amount) as total_collected,
                    CASE WHEN SUM(i.total_amount) > 0 THEN (SUM(i.paid_amount) / SUM(i.total_amount)) * 100 ELSE 0 END as collection_rate
                FROM invoices i
                WHERE i.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
                ORDER BY month
            ");
            echo json_encode(['success' => true, 'collection' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'by_fee_type') {
            // Get fee breakdown from invoice_items joined with fee_types
            $stmt = $pdo->query("
                SELECT 
                    COALESCE(ft.name, ii.label) as fee_name,
                    SUM(ii.amount) as total_amount,
                    COUNT(DISTINCT ii.invoice_id) as invoice_count,
                    SUM(CASE WHEN i.status = 'paid' THEN ii.amount ELSE 0 END) as collected_amount
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                LEFT JOIN fee_types ft ON ii.fee_type_id = ft.id
                WHERE YEAR(i.created_at) = YEAR(CURDATE())
                GROUP BY COALESCE(ft.id, ii.label), COALESCE(ft.name, ii.label)
                ORDER BY total_amount DESC
            ");
            echo json_encode(['success' => true, 'by_fee_type' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'payment_methods') {
            $stmt = $pdo->query("
                SELECT 
                    payment_method,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_amount
                FROM payments
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY payment_method
                ORDER BY total_amount DESC
            ");
            echo json_encode(['success' => true, 'payment_methods' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'forecast') {
            // Simple revenue forecast based on historical data
            $stmt = $pdo->query("
                SELECT 
                    AVG(monthly_revenue) as avg_monthly_revenue,
                    STDDEV(monthly_revenue) as stddev_revenue
                FROM (
                    SELECT 
                        DATE_FORMAT(payment_date, '%Y-%m') as month,
                        SUM(amount) as monthly_revenue
                    FROM payments
                    WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                ) as monthly_data
            ");
            $forecast = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Generate 3-month forecast
            $predictions = [];
            for ($i = 1; $i <= 3; $i++) {
                $predictions[] = [
                    'month' => date('Y-m', strtotime("+$i month")),
                    'predicted_revenue' => round($forecast['avg_monthly_revenue'], 2),
                    'confidence' => 'medium'
                ];
            }
            
            echo json_encode(['success' => true, 'forecast' => $predictions]);
        }
    }

    // ============================================
    // ATTENDANCE ANALYTICS
    // ============================================
    elseif ($resource === 'attendance') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'trends') {
            $stmt = $pdo->query("
                SELECT 
                    DATE(date) as att_date,
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
                    (COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*)) * 100 as attendance_rate
                FROM attendance
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(date)
                ORDER BY att_date
            ");
            echo json_encode(['success' => true, 'trends' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'by_class') {
            $stmt = $pdo->query("
                SELECT 
                    c.class_name,
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                    CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100 ELSE 0 END as attendance_rate
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY c.id, c.class_name
                ORDER BY attendance_rate DESC
            ");
            echo json_encode(['success' => true, 'by_class' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'chronic_absentees') {
            $stmt = $pdo->query("
                SELECT 
                    s.id,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    c.class_name,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
                    COUNT(a.id) as total_days,
                    CASE WHEN COUNT(a.id) > 0 THEN (COUNT(CASE WHEN a.status = 'absent' THEN 1 END) / COUNT(a.id)) * 100 ELSE 0 END as absence_rate
                FROM students s
                JOIN classes c ON s.class_id = c.id
                LEFT JOIN attendance a ON s.id = a.student_id 
                    AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                WHERE s.status = 'active'
                GROUP BY s.id, s.first_name, s.last_name, c.class_name
                HAVING absence_rate > 25
                ORDER BY absence_rate DESC
                LIMIT 20
            ");
            echo json_encode(['success' => true, 'chronic_absentees' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // ============================================
    // EXAM ANALYTICS
    // ============================================
    elseif ($resource === 'exams') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'performance_trends') {
            $stmt = $pdo->query("
                SELECT 
                    e.exam_name,
                    AVG(er.percentage) as avg_percentage,
                    MAX(er.percentage) as highest_percentage,
                    MIN(er.percentage) as lowest_percentage,
                    COUNT(er.id) as student_count
                FROM exam_results er
                JOIN exam_schedules es ON er.exam_schedule_id = es.id
                JOIN exams e ON es.exam_id = e.id
                WHERE e.start_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY e.id, e.exam_name
                ORDER BY e.start_date DESC
            ");
            echo json_encode(['success' => true, 'trends' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'subject_performance') {
            $examId = $_GET['exam_id'] ?? null;
            $stmt = $pdo->prepare("
                SELECT 
                    s.subject_name,
                    AVG(er.percentage) as avg_percentage,
                    MAX(er.percentage) as highest_percentage,
                    MIN(er.percentage) as lowest_percentage,
                    COUNT(er.id) as student_count,
                    COUNT(CASE WHEN er.percentage >= es.pass_marks THEN 1 END) as pass_count,
                    (COUNT(CASE WHEN er.percentage >= es.pass_marks THEN 1 END) / COUNT(er.id)) * 100 as pass_rate
                FROM exam_results er
                JOIN exam_schedules es ON er.exam_schedule_id = es.id
                JOIN subjects s ON es.subject_id = s.id
                WHERE es.exam_id = ?
                GROUP BY s.id, s.subject_name
                ORDER BY avg_percentage DESC
            ");
            $stmt->execute([$examId]);
            echo json_encode(['success' => true, 'subject_performance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'grade_distribution') {
            $examId = $_GET['exam_id'] ?? null;
            $stmt = $pdo->prepare("
                SELECT 
                    er.grade,
                    COUNT(*) as count,
                    (COUNT(*) / (SELECT COUNT(*) FROM exam_results er2 
                                 JOIN exam_schedules es2 ON er2.exam_schedule_id = es2.id 
                                 WHERE es2.exam_id = ?)) * 100 as percentage
                FROM exam_results er
                JOIN exam_schedules es ON er.exam_schedule_id = es.id
                WHERE es.exam_id = ?
                GROUP BY er.grade
                ORDER BY 
                    CASE er.grade
                        WHEN 'A+' THEN 1
                        WHEN 'A' THEN 2
                        WHEN 'B+' THEN 3
                        WHEN 'B' THEN 4
                        WHEN 'C+' THEN 5
                        WHEN 'C' THEN 6
                        WHEN 'D' THEN 7
                        WHEN 'F' THEN 8
                        ELSE 9
                    END
            ");
            $stmt->execute([$examId, $examId]);
            echo json_encode(['success' => true, 'distribution' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // ============================================
    // TEACHER ANALYTICS
    // ============================================
    elseif ($resource === 'teachers') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'workload') {
            $stmt = $pdo->query("
                SELECT 
                    t.id,
                    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                    (SELECT COUNT(*) FROM timetable_entries WHERE teacher_id = t.id) as classes_assigned,
                    (SELECT COUNT(*) FROM courses WHERE teacher_id = t.id) as courses_assigned,
                    (SELECT COUNT(*) FROM exam_invigilators WHERE teacher_id = t.id) as invigilation_duties
                FROM teachers t
                WHERE t.status = 'active'
                ORDER BY classes_assigned DESC
            ");
            echo json_encode(['success' => true, 'workload' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            
        } elseif ($action === 'performance') {
            $stmt = $pdo->query("
                SELECT 
                    t.id,
                    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                    s.subject_name,
                    AVG(er.percentage) as avg_student_performance,
                    COUNT(DISTINCT er.student_id) as students_taught
                FROM teachers t
                JOIN exam_schedules es ON t.id = es.subject_id
                JOIN subjects s ON es.subject_id = s.id
                LEFT JOIN exam_results er ON es.id = er.exam_schedule_id
                WHERE t.status = 'active'
                GROUP BY t.id, s.id
                HAVING students_taught > 0
                ORDER BY avg_student_performance DESC
            ");
            echo json_encode(['success' => true, 'performance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // ============================================
    // CUSTOM REPORTS
    // ============================================
    elseif ($resource === 'custom_report') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Build dynamic query based on filters
        $query = "SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE 1=1";
        $params = [];
        
        if (!empty($data['class_id'])) {
            $query .= " AND s.class_id = ?";
            $params[] = $data['class_id'];
        }
        
        if (!empty($data['status'])) {
            $query .= " AND s.status = ?";
            $params[] = $data['status'];
        }
        
        if (!empty($data['date_from'])) {
            $query .= " AND s.admission_date >= ?";
            $params[] = $data['date_from'];
        }
        
        if (!empty($data['date_to'])) {
            $query .= " AND s.admission_date <= ?";
            $params[] = $data['date_to'];
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'results' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // ============================================
    // DRILL-DOWN DETAILS
    // ============================================
    elseif ($resource === 'drilldown') {
        $type = $_GET['type'] ?? '';
        $id = $_GET['id'] ?? '';
        
        $details = [];
        
        if ($type === 'class') {
            $stmt = $pdo->prepare("
                SELECT s.student_id, CONCAT(s.first_name, ' ', s.last_name) as name, s.gender, s.status
                FROM students s WHERE s.class_id = ? AND s.status = 'active'
            ");
            $stmt->execute([$id]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($type === 'payment_method') {
            $stmt = $pdo->prepare("
                SELECT p.payment_number, p.amount, p.payment_date, CONCAT(s.first_name, ' ', s.last_name) as student
                FROM payments p
                JOIN students s ON p.student_id = s.id
                WHERE p.payment_method = ?
                ORDER BY p.payment_date DESC LIMIT 50
            ");
            $stmt->execute([$id]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($type === 'exam') {
            $stmt = $pdo->prepare("
                SELECT CONCAT(s.first_name, ' ', s.last_name) as student, er.marks, er.percentage, er.grade
                FROM exam_results er
                JOIN students s ON er.student_id = s.id
                WHERE er.exam_schedule_id = ?
                ORDER BY er.percentage DESC
            ");
            $stmt->execute([$id]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'details' => $details]);
    }

    // ============================================
    // ADDITIONAL ANALYTICS ENDPOINTS
    // ============================================
    elseif ($resource === 'students' && ($_GET['action'] ?? '') === 'grade_distribution') {
        $stmt = $pdo->query("
            SELECT 
                CASE 
                    WHEN er.percentage >= 80 THEN 'A'
                    WHEN er.percentage >= 70 THEN 'B'
                    WHEN er.percentage >= 60 THEN 'C'
                    WHEN er.percentage >= 50 THEN 'D'
                    ELSE 'F'
                END as grade,
                COUNT(*) as count
            FROM exam_results er
            GROUP BY grade
            ORDER BY grade
        ");
        echo json_encode(['success' => true, 'grade_distribution' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($resource === 'finance' && ($_GET['action'] ?? '') === 'projections') {
        // Simple projection based on average monthly revenue
        $stmt = $pdo->query("
            SELECT 
                AVG(monthly_revenue) as avg_monthly,
                AVG(monthly_revenue) * 12 as projected_annual
            FROM (
                SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as monthly_revenue
                FROM payments
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ) as monthly
        ");
        $projection = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'projections' => $projection]);
    }

    elseif ($resource === 'attendance' && ($_GET['action'] ?? '') === 'weekday_pattern') {
        $stmt = $pdo->query("
            SELECT 
                DAYNAME(date) as day_name,
                DAYOFWEEK(date) as day_num,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*) * 100, 1) as rate
            FROM attendance
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DAYOFWEEK(date), DAYNAME(date)
            ORDER BY day_num
        ");
        echo json_encode(['success' => true, 'weekday_pattern' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($resource === 'exams' && ($_GET['action'] ?? '') === 'subject_performance') {
        $stmt = $pdo->query("
            SELECT 
                s.subject_name,
                AVG(er.percentage) as avg_percentage,
                COUNT(DISTINCT er.student_id) as students,
                MAX(er.percentage) as highest,
                MIN(er.percentage) as lowest
            FROM exam_results er
            JOIN exam_schedules es ON er.exam_schedule_id = es.id
            JOIN subjects s ON es.subject_id = s.id
            GROUP BY s.id, s.subject_name
            ORDER BY avg_percentage DESC
        ");
        echo json_encode(['success' => true, 'subject_performance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($resource === 'exams' && ($_GET['action'] ?? '') === 'grade_breakdown') {
        $stmt = $pdo->query("
            SELECT 
                CASE 
                    WHEN percentage >= 80 THEN 'A (80-100%)'
                    WHEN percentage >= 70 THEN 'B (70-79%)'
                    WHEN percentage >= 60 THEN 'C (60-69%)'
                    WHEN percentage >= 50 THEN 'D (50-59%)'
                    ELSE 'F (Below 50%)'
                END as grade_range,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exam_results), 1) as percentage
            FROM exam_results
            GROUP BY grade_range
            ORDER BY MIN(percentage) DESC
        ");
        echo json_encode(['success' => true, 'grade_breakdown' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($resource === 'exams' && ($_GET['action'] ?? '') === 'class_rankings') {
        $stmt = $pdo->query("
            SELECT 
                c.class_name,
                AVG(er.percentage) as avg_percentage,
                COUNT(DISTINCT er.student_id) as students,
                RANK() OVER (ORDER BY AVG(er.percentage) DESC) as rank_position
            FROM exam_results er
            JOIN students s ON er.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            GROUP BY c.id, c.class_name
            ORDER BY avg_percentage DESC
        ");
        echo json_encode(['success' => true, 'class_rankings' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($resource === 'teachers' && ($_GET['action'] ?? '') === 'student_outcomes') {
        $stmt = $pdo->query("
            SELECT 
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                COUNT(DISTINCT s.id) as students_taught,
                AVG(er.percentage) as avg_student_score,
                COUNT(CASE WHEN er.percentage >= 50 THEN 1 END) as passed,
                COUNT(CASE WHEN er.percentage < 50 THEN 1 END) as failed
            FROM teachers t
            JOIN classes c ON c.teacher_id = t.id
            JOIN students s ON s.class_id = c.id
            LEFT JOIN exam_results er ON er.student_id = s.id
            WHERE t.status = 'active'
            GROUP BY t.id
            HAVING students_taught > 0
            ORDER BY avg_student_score DESC
        ");
        echo json_encode(['success' => true, 'student_outcomes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid resource or action']);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
