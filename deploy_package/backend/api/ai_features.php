<?php
/**
 * AI Features API
 * Advanced AI capabilities: predictions, recommendations, chatbot, insights
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    // PREDICTIONS
    // ============================================
    if ($resource === 'predictions') {
        switch ($method) {
            case 'GET':
                if ($action === 'student_performance') {
                    $studentId = $_GET['student_id'] ?? null;
                    
                    // Generate prediction
                    $prediction = predictStudentPerformance($pdo, $studentId);
                    
                    // Save prediction
                    $stmt = $pdo->prepare("
                        INSERT INTO ai_predictions 
                        (prediction_type, entity_type, entity_id, prediction_data, confidence_score, prediction_date, model_version, status)
                        VALUES ('student_performance', 'student', ?, ?, ?, CURDATE(), '1.0', 'completed')
                    ");
                    $stmt->execute([$studentId, json_encode($prediction), $prediction['confidence']]);
                    
                    echo json_encode(['success' => true, 'prediction' => $prediction]);
                    
                } elseif ($action === 'dropout_risk') {
                    $studentId = $_GET['student_id'] ?? null;
                    
                    $risk = calculateDropoutRisk($pdo, $studentId);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO ai_predictions 
                        (prediction_type, entity_type, entity_id, prediction_data, confidence_score, prediction_date, status)
                        VALUES ('dropout_risk', 'student', ?, ?, ?, CURDATE(), 'completed')
                    ");
                    $stmt->execute([$studentId, json_encode($risk), $risk['confidence']]);
                    
                    echo json_encode(['success' => true, 'risk_assessment' => $risk]);
                    
                } elseif ($action === 'financial_forecast') {
                    $months = $_GET['months'] ?? 3;
                    
                    $forecast = forecastRevenue($pdo, $months);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO ai_predictions 
                        (prediction_type, entity_type, entity_id, prediction_data, confidence_score, prediction_date, forecast_period, status)
                        VALUES ('financial_forecast', 'school', 1, ?, ?, CURDATE(), ?, 'completed')
                    ");
                    $stmt->execute([json_encode($forecast), $forecast['confidence'], "{$months} months"]);
                    
                    echo json_encode(['success' => true, 'forecast' => $forecast]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM ai_predictions WHERE id = ?");
                    $stmt->execute([$id]);
                    $prediction = $stmt->fetch(PDO::FETCH_ASSOC);
                    $prediction['prediction_data'] = json_decode($prediction['prediction_data'], true);
                    echo json_encode(['success' => true, 'prediction' => $prediction]);
                    
                } else {
                    $stmt = $pdo->query("
                        SELECT * FROM ai_predictions 
                        ORDER BY created_at DESC 
                        LIMIT 50
                    ");
                    echo json_encode(['success' => true, 'predictions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;
        }
    }

    // ============================================
    // RECOMMENDATIONS
    // ============================================
    elseif ($resource === 'recommendations') {
        switch ($method) {
            case 'GET':
                if ($action === 'generate') {
                    $targetType = $_GET['target_type'] ?? 'school';
                    $targetId = $_GET['target_id'] ?? null;
                    
                    $recommendations = generateRecommendations($pdo, $targetType, $targetId);
                    
                    foreach ($recommendations as $rec) {
                        $stmt = $pdo->prepare("
                            INSERT INTO ai_recommendations 
                            (recommendation_type, target_type, target_id, title, description, priority, confidence_score, expected_impact, action_items, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                        ");
                        $stmt->execute([
                            $rec['type'],
                            $targetType,
                            $targetId,
                            $rec['title'],
                            $rec['description'],
                            $rec['priority'],
                            $rec['confidence'],
                            $rec['impact'],
                            json_encode($rec['actions'])
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'recommendations' => $recommendations]);
                    
                } elseif ($action === 'pending') {
                    $stmt = $pdo->query("
                        SELECT * FROM ai_recommendations 
                        WHERE status = 'pending'
                        ORDER BY priority DESC, confidence_score DESC
                        LIMIT 20
                    ");
                    echo json_encode(['success' => true, 'recommendations' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM ai_recommendations WHERE id = ?");
                    $stmt->execute([$id]);
                    $rec = $stmt->fetch(PDO::FETCH_ASSOC);
                    $rec['action_items'] = json_decode($rec['action_items'], true);
                    echo json_encode(['success' => true, 'recommendation' => $rec]);
                }
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'implement') {
                    $stmt = $pdo->prepare("
                        UPDATE ai_recommendations 
                        SET status = 'implemented', implemented_date = CURDATE()
                        WHERE id = ?
                    ");
                    $stmt->execute([$id]);
                } elseif ($action === 'dismiss') {
                    $stmt = $pdo->prepare("UPDATE ai_recommendations SET status = 'dismissed' WHERE id = ?");
                    $stmt->execute([$id]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // CHATBOT
    // ============================================
    elseif ($resource === 'chatbot') {
        switch ($method) {
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'message') {
                    $sessionId = $data['session_id'] ?? uniqid('chat_');
                    $message = $data['message'];
                    $userId = $data['user_id'] ?? null;
                    $userType = $data['user_type'] ?? 'guest';
                    
                    // Get or create conversation
                    $stmt = $pdo->prepare("SELECT * FROM chatbot_conversations WHERE session_id = ?");
                    $stmt->execute([$sessionId]);
                    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$conversation) {
                        $stmt = $pdo->prepare("
                            INSERT INTO chatbot_conversations (session_id, user_id, user_type, conversation_data)
                            VALUES (?, ?, ?, '[]')
                        ");
                        $stmt->execute([$sessionId, $userId, $userType]);
                        $conversationId = $pdo->lastInsertId();
                        $conversationData = [];
                    } else {
                        $conversationId = $conversation['id'];
                        $conversationData = json_decode($conversation['conversation_data'], true);
                    }
                    
                    // Get bot response
                    $response = getBotResponse($pdo, $message);
                    
                    // Update conversation
                    $conversationData[] = ['role' => 'user', 'message' => $message, 'timestamp' => date('Y-m-d H:i:s')];
                    $conversationData[] = ['role' => 'bot', 'message' => $response['answer'], 'timestamp' => date('Y-m-d H:i:s')];
                    
                    $stmt = $pdo->prepare("
                        UPDATE chatbot_conversations 
                        SET conversation_data = ?, intent = ?, sentiment = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        json_encode($conversationData),
                        $response['intent'] ?? null,
                        $response['sentiment'] ?? 'neutral',
                        $conversationId
                    ]);
                    
                    echo json_encode([
                        'success' => true,
                        'session_id' => $sessionId,
                        'response' => $response['answer'],
                        'confidence' => $response['confidence']
                    ]);
                }
                break;

            case 'GET':
                if ($action === 'history') {
                    $sessionId = $_GET['session_id'] ?? null;
                    $stmt = $pdo->prepare("SELECT * FROM chatbot_conversations WHERE session_id = ?");
                    $stmt->execute([$sessionId]);
                    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($conversation) {
                        $conversation['conversation_data'] = json_decode($conversation['conversation_data'], true);
                    }
                    echo json_encode(['success' => true, 'conversation' => $conversation]);
                }
                break;
        }
    }

    // ============================================
    // INSIGHTS
    // ============================================
    elseif ($resource === 'insights') {
        switch ($method) {
            case 'GET':
                if ($action === 'generate') {
                    $insights = generateInsights($pdo);
                    
                    foreach ($insights as $insight) {
                        $stmt = $pdo->prepare("
                            INSERT INTO automated_insights 
                            (insight_type, category, title, description, data_points, confidence_level, impact_level, recommended_actions, generated_date, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')
                        ");
                        $stmt->execute([
                            $insight['type'],
                            $insight['category'],
                            $insight['title'],
                            $insight['description'],
                            json_encode($insight['data']),
                            $insight['confidence'],
                            $insight['impact'],
                            $insight['actions']
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'insights' => $insights]);
                    
                } elseif ($action === 'active') {
                    $stmt = $pdo->query("
                        SELECT * FROM automated_insights 
                        WHERE status = 'active' AND (expires_date IS NULL OR expires_date >= CURDATE())
                        ORDER BY impact_level DESC, confidence_level DESC
                        LIMIT 10
                    ");
                    echo json_encode(['success' => true, 'insights' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;
        }
    }

    // ============================================
    // ANOMALY DETECTION
    // ============================================
    elseif ($resource === 'anomalies') {
        switch ($method) {
            case 'GET':
                if ($action === 'detect') {
                    $anomalies = detectAnomalies($pdo);
                    
                    foreach ($anomalies as $anomaly) {
                        $stmt = $pdo->prepare("
                            INSERT INTO anomaly_detections 
                            (anomaly_type, entity_type, entity_id, description, severity, detected_value, expected_value, deviation_percentage, detection_date, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'open')
                        ");
                        $stmt->execute([
                            $anomaly['type'],
                            $anomaly['entity_type'],
                            $anomaly['entity_id'],
                            $anomaly['description'],
                            $anomaly['severity'],
                            $anomaly['detected_value'],
                            $anomaly['expected_value'],
                            $anomaly['deviation']
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'anomalies' => $anomalies]);
                    
                } elseif ($action === 'open') {
                    $stmt = $pdo->query("
                        SELECT * FROM anomaly_detections 
                        WHERE status = 'open'
                        ORDER BY severity DESC, detection_date DESC
                        LIMIT 20
                    ");
                    echo json_encode(['success' => true, 'anomalies' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;
        }
    }

    // ============================================
    // PERSONALIZED LEARNING
    // ============================================
    elseif ($resource === 'learning_paths') {
        switch ($method) {
            case 'GET':
                if ($action === 'generate') {
                    $studentId = $_GET['student_id'] ?? null;
                    $subjectId = $_GET['subject_id'] ?? null;
                    
                    $path = generateLearningPath($pdo, $studentId, $subjectId);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO personalized_learning_paths 
                        (student_id, subject_id, current_level, target_level, learning_style, strengths, weaknesses, recommended_resources, milestones, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                        ON DUPLICATE KEY UPDATE
                        current_level = VALUES(current_level),
                        recommended_resources = VALUES(recommended_resources),
                        milestones = VALUES(milestones)
                    ");
                    $stmt->execute([
                        $studentId,
                        $subjectId,
                        $path['current_level'],
                        $path['target_level'],
                        $path['learning_style'],
                        json_encode($path['strengths']),
                        json_encode($path['weaknesses']),
                        json_encode($path['resources']),
                        json_encode($path['milestones'])
                    ]);
                    
                    echo json_encode(['success' => true, 'learning_path' => $path]);
                    
                } elseif ($action === 'by_student') {
                    $studentId = $_GET['student_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            plp.*,
                            s.subject_name
                        FROM personalized_learning_paths plp
                        JOIN subjects s ON plp.subject_id = s.id
                        WHERE plp.student_id = ? AND plp.status = 'active'
                    ");
                    $stmt->execute([$studentId]);
                    echo json_encode(['success' => true, 'learning_paths' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// AI HELPER FUNCTIONS
// ============================================

function predictStudentPerformance($pdo, $studentId) {
    // Get historical performance
    $stmt = $pdo->prepare("
        SELECT AVG(percentage) as avg_score, COUNT(*) as exam_count
        FROM exam_results
        WHERE student_id = ?
    ");
    $stmt->execute([$studentId]);
    $history = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Simple prediction (in production, use actual ML model)
    $predicted_score = $history['avg_score'] * 1.02; // Slight improvement trend
    $confidence = min(0.95, 0.60 + ($history['exam_count'] * 0.05));
    
    return [
        'predicted_score' => round($predicted_score, 2),
        'confidence' => round($confidence, 2),
        'trend' => $predicted_score > $history['avg_score'] ? 'improving' : 'declining',
        'recommendation' => $predicted_score < 50 ? 'Requires intervention' : 'On track'
    ];
}

function calculateDropoutRisk($pdo, $studentId) {
    // Get risk factors
    $stmt = $pdo->prepare("
        SELECT 
            (SELECT AVG(percentage) FROM exam_results WHERE student_id = ?) as avg_score,
            (SELECT COUNT(*) FROM attendance WHERE student_id = ? AND status = 'absent') as absent_days,
            (SELECT SUM(amount) FROM invoices WHERE student_id = ? AND status IN ('pending', 'partial')) as outstanding_fees
    ");
    $stmt->execute([$studentId, $studentId, $studentId]);
    $factors = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate risk score (0-100)
    $risk_score = 0;
    if ($factors['avg_score'] < 40) $risk_score += 40;
    if ($factors['absent_days'] > 10) $risk_score += 30;
    if ($factors['outstanding_fees'] > 1000) $risk_score += 30;
    
    $risk_level = $risk_score > 70 ? 'high' : ($risk_score > 40 ? 'medium' : 'low');
    
    return [
        'risk_score' => $risk_score,
        'risk_level' => $risk_level,
        'confidence' => 0.78,
        'factors' => $factors,
        'recommendation' => $risk_score > 50 ? 'Immediate intervention required' : 'Monitor closely'
    ];
}

function forecastRevenue($pdo, $months) {
    // Get historical revenue
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(payment_date, '%Y-%m') as month,
            SUM(amount) as revenue
        FROM payments
        WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ORDER BY month
    ");
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $avg_revenue = array_sum(array_column($history, 'revenue')) / count($history);
    
    // Simple forecast
    $forecast = [];
    for ($i = 1; $i <= $months; $i++) {
        $forecast[] = [
            'month' => date('Y-m', strtotime("+$i month")),
            'predicted_revenue' => round($avg_revenue * 1.05, 2), // 5% growth
            'lower_bound' => round($avg_revenue * 0.90, 2),
            'upper_bound' => round($avg_revenue * 1.20, 2)
        ];
    }
    
    return [
        'forecast' => $forecast,
        'confidence' => 0.72,
        'trend' => 'stable_growth'
    ];
}

function getBotResponse($pdo, $message) {
    // Search knowledge base
    $stmt = $pdo->prepare("
        SELECT * FROM chatbot_knowledge_base 
        WHERE status = 'active'
        AND MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)
        ORDER BY MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE) DESC
        LIMIT 1
    ");
    $stmt->execute([$message, $message]);
    $match = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($match) {
        // Update usage count
        $pdo->prepare("UPDATE chatbot_knowledge_base SET usage_count = usage_count + 1 WHERE id = ?")
            ->execute([$match['id']]);
        
        return [
            'answer' => $match['answer'],
            'confidence' => 0.85,
            'intent' => $match['category'],
            'sentiment' => 'neutral'
        ];
    }
    
    return [
        'answer' => "I'm sorry, I don't have information about that. Would you like me to connect you with a human agent?",
        'confidence' => 0.50,
        'intent' => 'unknown',
        'sentiment' => 'neutral'
    ];
}

function generateRecommendations($pdo, $targetType, $targetId) {
    $recommendations = [];
    
    // Example: Recommend intervention for at-risk students
    if ($targetType === 'school') {
        $stmt = $pdo->query("
            SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) as name,
            AVG(er.percentage) as avg_score
            FROM students s
            LEFT JOIN exam_results er ON s.id = er.student_id
            GROUP BY s.id
            HAVING avg_score < 40
            LIMIT 5
        ");
        $atRiskStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($atRiskStudents) > 0) {
            $recommendations[] = [
                'type' => 'intervention',
                'title' => 'At-Risk Students Identified',
                'description' => count($atRiskStudents) . ' students showing poor academic performance',
                'priority' => 'high',
                'confidence' => 0.88,
                'impact' => 'Implementing targeted interventions could improve pass rates by 15-20%',
                'actions' => ['Schedule parent meetings', 'Assign tutors', 'Create personalized learning plans']
            ];
        }
    }
    
    return $recommendations;
}

function generateInsights($pdo) {
    $insights = [];
    
    // Attendance trend insight
    $stmt = $pdo->query("
        SELECT 
            DATE(attendance_date) as date,
            COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*) * 100 as rate
        FROM attendance
        WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(attendance_date)
    ");
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($attendance) > 0) {
        $avg_rate = array_sum(array_column($attendance, 'rate')) / count($attendance);
        
        $insights[] = [
            'type' => 'trend',
            'category' => 'attendance',
            'title' => 'Weekly Attendance Trend',
            'description' => "Average attendance rate this week: " . round($avg_rate, 1) . "%",
            'data' => $attendance,
            'confidence' => 0.92,
            'impact' => 'medium',
            'actions' => 'Monitor students with declining attendance patterns'
        ];
    }
    
    return $insights;
}

function detectAnomalies($pdo) {
    $anomalies = [];
    
    // Detect unusual payment patterns
    $stmt = $pdo->query("
        SELECT 
            student_id,
            COUNT(*) as payment_count,
            SUM(amount) as total_amount
        FROM payments
        WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY student_id
        HAVING total_amount > 10000
    ");
    $unusual_payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($unusual_payments as $payment) {
        $anomalies[] = [
            'type' => 'financial',
            'entity_type' => 'student',
            'entity_id' => $payment['student_id'],
            'description' => 'Unusually high payment amount detected',
            'severity' => 'medium',
            'detected_value' => $payment['total_amount'],
            'expected_value' => 2000,
            'deviation' => (($payment['total_amount'] - 2000) / 2000) * 100
        ];
    }
    
    return $anomalies;
}

function generateLearningPath($pdo, $studentId, $subjectId) {
    // Get student performance in subject
    $stmt = $pdo->prepare("
        SELECT AVG(percentage) as avg_score
        FROM exam_results er
        JOIN exam_schedules es ON er.exam_schedule_id = es.id
        WHERE er.student_id = ? AND es.subject_id = ?
    ");
    $stmt->execute([$studentId, $subjectId]);
    $performance = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $current_level = $performance['avg_score'] >= 80 ? 'Advanced' : 
                    ($performance['avg_score'] >= 60 ? 'Intermediate' : 'Beginner');
    
    return [
        'current_level' => $current_level,
        'target_level' => 'Advanced',
        'learning_style' => 'visual', // Would be determined by assessment
        'strengths' => ['Problem solving', 'Critical thinking'],
        'weaknesses' => ['Time management', 'Test anxiety'],
        'resources' => [
            ['type' => 'video', 'title' => 'Introduction to Advanced Topics'],
            ['type' => 'practice', 'title' => 'Interactive Exercises'],
            ['type' => 'reading', 'title' => 'Supplementary Materials']
        ],
        'milestones' => [
            ['title' => 'Complete foundational modules', 'target_date' => date('Y-m-d', strtotime('+1 month'))],
            ['title' => 'Pass intermediate assessment', 'target_date' => date('Y-m-d', strtotime('+2 months'))],
            ['title' => 'Achieve advanced level', 'target_date' => date('Y-m-d', strtotime('+3 months'))]
        ]
    ];
}
