<?php
/**
 * Student Analytics & Performance Prediction API
 * Provides at-risk student detection and performance insights
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $action = $_GET['action'] ?? 'at_risk';
    $classId = $_GET['class_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 20), 100);

    switch ($action) {
        case 'at_risk':
            // Get students at risk of failing
            echo json_encode(getAtRiskStudents($pdo, $classId, $limit));
            break;
            
        case 'performance_trend':
            // Get performance trend for a student
            echo json_encode(getPerformanceTrend($pdo, $studentId));
            break;
            
        case 'class_analytics':
            // Get class-wide analytics
            echo json_encode(getClassAnalytics($pdo, $classId));
            break;
            
        case 'predictions':
            // Get grade predictions
            echo json_encode(getGradePredictions($pdo, $studentId));
            break;
            
        case 'early_warnings':
            // Get all early warnings for dashboard
            echo json_encode(getEarlyWarnings($pdo, $limit));
            break;
            
        case 'dashboard_stats':
            // Get dashboard statistics
            echo json_encode(getDashboardStats($pdo));
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

/**
 * Calculate risk score for a student based on multiple factors
 */
function calculateRiskScore($attendance, $avgGrade, $homeworkCompletion, $behaviorScore) {
    // Weights for each factor
    $weights = [
        'attendance' => 0.25,
        'grades' => 0.35,
        'homework' => 0.25,
        'behavior' => 0.15
    ];
    
    // Normalize scores (0-100)
    $attendanceScore = min(100, max(0, $attendance));
    $gradeScore = min(100, max(0, $avgGrade));
    $homeworkScore = min(100, max(0, $homeworkCompletion));
    $behaviorScore = min(100, max(0, $behaviorScore));
    
    // Calculate weighted score (higher is better)
    $score = (
        $attendanceScore * $weights['attendance'] +
        $gradeScore * $weights['grades'] +
        $homeworkScore * $weights['homework'] +
        $behaviorScore * $weights['behavior']
    );
    
    // Convert to risk score (lower score = higher risk)
    $riskScore = 100 - $score;
    
    return round($riskScore, 1);
}

/**
 * Get risk level based on score
 */
function getRiskLevel($riskScore) {
    if ($riskScore >= 70) return ['level' => 'critical', 'color' => '#ef4444', 'label' => 'Critical Risk'];
    if ($riskScore >= 50) return ['level' => 'high', 'color' => '#f97316', 'label' => 'High Risk'];
    if ($riskScore >= 30) return ['level' => 'medium', 'color' => '#eab308', 'label' => 'Medium Risk'];
    if ($riskScore >= 15) return ['level' => 'low', 'color' => '#22c55e', 'label' => 'Low Risk'];
    return ['level' => 'minimal', 'color' => '#3b82f6', 'label' => 'On Track'];
}

/**
 * Get students at risk of failing
 */
function getAtRiskStudents($pdo, $classId = null, $limit = 20) {
    $students = [];
    
    try {
        // Get all students with their metrics
        $sql = "
            SELECT 
                s.id,
                s.student_id,
                s.first_name,
                s.last_name,
                s.photo,
                c.class_name,
                c.id as class_id
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.status = 'active'
        ";
        
        if ($classId) {
            $sql .= " AND s.class_id = ?";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($classId ? [$classId] : []);
        $allStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($allStudents as $student) {
            // Get attendance rate
            $attendance = getStudentAttendance($pdo, $student['id']);
            
            // Get average grade
            $avgGrade = getStudentAverageGrade($pdo, $student['id']);
            
            // Get homework completion rate
            $homeworkRate = getHomeworkCompletionRate($pdo, $student['id']);
            
            // Behavior score (default to 80 if no data)
            $behaviorScore = 80;
            
            // Calculate risk score
            $riskScore = calculateRiskScore($attendance, $avgGrade, $homeworkRate, $behaviorScore);
            $riskInfo = getRiskLevel($riskScore);
            
            // Only include students with risk score >= 30 (medium risk or higher)
            if ($riskScore >= 30) {
                $students[] = [
                    'id' => $student['id'],
                    'student_id' => $student['student_id'],
                    'name' => $student['first_name'] . ' ' . $student['last_name'],
                    'photo' => $student['photo'],
                    'class_name' => $student['class_name'],
                    'class_id' => $student['class_id'],
                    'risk_score' => $riskScore,
                    'risk_level' => $riskInfo['level'],
                    'risk_label' => $riskInfo['label'],
                    'risk_color' => $riskInfo['color'],
                    'metrics' => [
                        'attendance' => round($attendance, 1),
                        'average_grade' => round($avgGrade, 1),
                        'homework_completion' => round($homeworkRate, 1),
                        'behavior_score' => $behaviorScore
                    ],
                    'recommendations' => generateRecommendations($attendance, $avgGrade, $homeworkRate)
                ];
            }
        }
        
        // Sort by risk score (highest first)
        usort($students, function($a, $b) {
            return $b['risk_score'] <=> $a['risk_score'];
        });
        
        // Limit results
        $students = array_slice($students, 0, $limit);
        
    } catch (Exception $e) {
        // Return empty array on error
    }
    
    return [
        'success' => true,
        'students' => $students,
        'total_at_risk' => count($students),
        'summary' => [
            'critical' => count(array_filter($students, fn($s) => $s['risk_level'] === 'critical')),
            'high' => count(array_filter($students, fn($s) => $s['risk_level'] === 'high')),
            'medium' => count(array_filter($students, fn($s) => $s['risk_level'] === 'medium'))
        ]
    ];
}

/**
 * Get student attendance percentage
 */
function getStudentAttendance($pdo, $studentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM attendance
            WHERE student_id = ?
            AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['total'] > 0) {
            return ($result['present'] / $result['total']) * 100;
        }
    } catch (Exception $e) {}
    
    return 85; // Default if no data
}

/**
 * Get student average grade
 */
function getStudentAverageGrade($pdo, $studentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT AVG(score) as avg_score
            FROM grades
            WHERE student_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ");
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['avg_score']) {
            return $result['avg_score'];
        }
    } catch (Exception $e) {}
    
    return 70; // Default if no data
}

/**
 * Get homework completion rate
 */
function getHomeworkCompletionRate($pdo, $studentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN hs.status = 'submitted' OR hs.status = 'graded' THEN 1 ELSE 0 END) as completed
            FROM homework h
            LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
            WHERE h.due_date <= CURDATE()
            AND h.due_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['total'] > 0) {
            return ($result['completed'] / $result['total']) * 100;
        }
    } catch (Exception $e) {}
    
    return 75; // Default if no data
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations($attendance, $avgGrade, $homeworkRate) {
    $recommendations = [];
    
    if ($attendance < 80) {
        $recommendations[] = [
            'type' => 'attendance',
            'priority' => 'high',
            'message' => 'Schedule a meeting with parents to discuss attendance issues',
            'action' => 'Contact parent'
        ];
    }
    
    if ($avgGrade < 50) {
        $recommendations[] = [
            'type' => 'academic',
            'priority' => 'critical',
            'message' => 'Arrange remedial classes and extra tutoring sessions',
            'action' => 'Schedule tutoring'
        ];
    } elseif ($avgGrade < 65) {
        $recommendations[] = [
            'type' => 'academic',
            'priority' => 'high',
            'message' => 'Provide additional study materials and practice exercises',
            'action' => 'Assign extra work'
        ];
    }
    
    if ($homeworkRate < 60) {
        $recommendations[] = [
            'type' => 'homework',
            'priority' => 'high',
            'message' => 'Monitor homework completion and set up accountability system',
            'action' => 'Track homework'
        ];
    }
    
    if (empty($recommendations)) {
        $recommendations[] = [
            'type' => 'general',
            'priority' => 'low',
            'message' => 'Continue monitoring progress and provide encouragement',
            'action' => 'Monitor'
        ];
    }
    
    return $recommendations;
}

/**
 * Get early warnings for dashboard
 */
function getEarlyWarnings($pdo, $limit = 10) {
    $warnings = [];
    
    // Get at-risk students
    $atRisk = getAtRiskStudents($pdo, null, $limit);
    
    foreach ($atRisk['students'] as $student) {
        $warnings[] = [
            'id' => 'risk_' . $student['id'],
            'type' => 'at_risk_student',
            'severity' => $student['risk_level'],
            'title' => $student['name'] . ' is at ' . $student['risk_label'],
            'message' => 'Risk score: ' . $student['risk_score'] . '%. ' . 
                        'Attendance: ' . $student['metrics']['attendance'] . '%, ' .
                        'Avg Grade: ' . $student['metrics']['average_grade'] . '%',
            'student_id' => $student['id'],
            'student_name' => $student['name'],
            'class_name' => $student['class_name'],
            'created_at' => date('Y-m-d H:i:s'),
            'action_url' => '/admin/students/' . $student['id']
        ];
    }
    
    return [
        'success' => true,
        'warnings' => $warnings,
        'total' => count($warnings)
    ];
}

/**
 * Get dashboard statistics
 */
function getDashboardStats($pdo) {
    $stats = [
        'total_students' => 0,
        'at_risk_count' => 0,
        'critical_count' => 0,
        'average_attendance' => 0,
        'average_grade' => 0
    ];
    
    try {
        // Total active students
        $stmt = $pdo->query("SELECT COUNT(*) FROM students WHERE status = 'active'");
        $stats['total_students'] = (int)$stmt->fetchColumn();
        
        // Get at-risk summary
        $atRisk = getAtRiskStudents($pdo, null, 1000);
        $stats['at_risk_count'] = $atRisk['total_at_risk'];
        $stats['critical_count'] = $atRisk['summary']['critical'];
        
        // Average attendance (last 30 days)
        $stmt = $pdo->query("
            SELECT 
                (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as avg_attendance
            FROM attendance
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['average_attendance'] = round($result['avg_attendance'] ?? 85, 1);
        
        // Average grade
        $stmt = $pdo->query("
            SELECT AVG(score) as avg_grade
            FROM grades
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['average_grade'] = round($result['avg_grade'] ?? 70, 1);
        
    } catch (Exception $e) {}
    
    return [
        'success' => true,
        'stats' => $stats
    ];
}

/**
 * Get performance trend for a student
 */
function getPerformanceTrend($pdo, $studentId) {
    $trend = [];
    
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    try {
        // Get monthly averages for the past 6 months
        $stmt = $pdo->prepare("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                AVG(score) as avg_score
            FROM grades
            WHERE student_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $stmt->execute([$studentId]);
        $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate trend direction
        $trendDirection = 'stable';
        if (count($trend) >= 2) {
            $first = $trend[0]['avg_score'];
            $last = $trend[count($trend) - 1]['avg_score'];
            if ($last > $first + 5) $trendDirection = 'improving';
            elseif ($last < $first - 5) $trendDirection = 'declining';
        }
        
    } catch (Exception $e) {}
    
    return [
        'success' => true,
        'trend' => $trend,
        'direction' => $trendDirection
    ];
}

/**
 * Get class analytics
 */
function getClassAnalytics($pdo, $classId) {
    if (!$classId) {
        return ['success' => false, 'error' => 'Class ID required'];
    }
    
    $analytics = [
        'class_average' => 0,
        'attendance_rate' => 0,
        'top_performers' => [],
        'struggling_students' => [],
        'subject_performance' => []
    ];
    
    try {
        // Class average grade
        $stmt = $pdo->prepare("
            SELECT AVG(g.score) as avg_score
            FROM grades g
            JOIN students s ON g.student_id = s.id
            WHERE s.class_id = ?
            AND g.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ");
        $stmt->execute([$classId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $analytics['class_average'] = round($result['avg_score'] ?? 0, 1);
        
        // Get at-risk students in this class
        $atRisk = getAtRiskStudents($pdo, $classId, 5);
        $analytics['struggling_students'] = $atRisk['students'];
        
    } catch (Exception $e) {}
    
    return [
        'success' => true,
        'analytics' => $analytics
    ];
}

/**
 * Get grade predictions for a student
 */
function getGradePredictions($pdo, $studentId) {
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    $predictions = [];
    
    try {
        // Get recent grades by subject
        $stmt = $pdo->prepare("
            SELECT 
                sub.id as subject_id,
                sub.name as subject_name,
                AVG(g.score) as current_avg,
                COUNT(g.id) as grade_count
            FROM grades g
            JOIN subjects sub ON g.subject_id = sub.id
            WHERE g.student_id = ?
            AND g.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            GROUP BY sub.id, sub.name
        ");
        $stmt->execute([$studentId]);
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($subjects as $subject) {
            // Simple prediction based on current average and trend
            $currentAvg = $subject['current_avg'];
            $predictedGrade = $currentAvg; // Baseline
            
            // Adjust based on trend (simplified)
            $trend = getSubjectTrend($pdo, $studentId, $subject['subject_id']);
            if ($trend === 'improving') $predictedGrade += 5;
            elseif ($trend === 'declining') $predictedGrade -= 5;
            
            $predictions[] = [
                'subject_id' => $subject['subject_id'],
                'subject_name' => $subject['subject_name'],
                'current_average' => round($currentAvg, 1),
                'predicted_grade' => round(min(100, max(0, $predictedGrade)), 1),
                'trend' => $trend,
                'confidence' => min(95, 60 + ($subject['grade_count'] * 5))
            ];
        }
        
    } catch (Exception $e) {}
    
    return [
        'success' => true,
        'predictions' => $predictions
    ];
}

function getSubjectTrend($pdo, $studentId, $subjectId) {
    try {
        $stmt = $pdo->prepare("
            SELECT score, created_at
            FROM grades
            WHERE student_id = ? AND subject_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$studentId, $subjectId]);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($grades) >= 2) {
            $recent = array_slice($grades, 0, 2);
            $older = array_slice($grades, -2);
            $recentAvg = array_sum(array_column($recent, 'score')) / count($recent);
            $olderAvg = array_sum(array_column($older, 'score')) / count($older);
            
            if ($recentAvg > $olderAvg + 5) return 'improving';
            if ($recentAvg < $olderAvg - 5) return 'declining';
        }
    } catch (Exception $e) {}
    
    return 'stable';
}
