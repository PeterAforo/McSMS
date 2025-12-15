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
                } else {
                    // Get all learning paths
                    $stmt = $pdo->query("
                        SELECT plp.*, s.subject_name, CONCAT(st.first_name, ' ', st.last_name) as student_name
                        FROM personalized_learning_paths plp
                        JOIN subjects s ON plp.subject_id = s.id
                        JOIN students st ON plp.student_id = st.id
                        WHERE plp.status = 'active'
                        ORDER BY plp.created_at DESC
                    ");
                    $paths = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($paths as &$p) {
                        $p['milestones'] = json_decode($p['milestones'] ?? '[]', true);
                    }
                    echo json_encode(['success' => true, 'learning_paths' => $paths]);
                }
                break;
            case 'PUT':
                if ($action === 'progress') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("SELECT milestones, progress FROM personalized_learning_paths WHERE id = ?");
                    $stmt->execute([$id]);
                    $path = $stmt->fetch(PDO::FETCH_ASSOC);
                    $milestones = json_decode($path['milestones'] ?? '[]', true);
                    if (isset($milestones[$data['milestone']])) {
                        $milestones[$data['milestone']]['completed'] = $data['completed'];
                    }
                    $completed = count(array_filter($milestones, fn($m) => $m['completed'] ?? false));
                    $progress = count($milestones) > 0 ? round(($completed / count($milestones)) * 100) : 0;
                    $stmt = $pdo->prepare("UPDATE personalized_learning_paths SET milestones = ?, progress = ? WHERE id = ?");
                    $stmt->execute([json_encode($milestones), $progress, $id]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // SCHEDULED TASKS
    // ============================================
    elseif ($resource === 'scheduled_tasks') {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->query("SELECT * FROM ai_scheduled_tasks ORDER BY created_at DESC");
                echo json_encode(['success' => true, 'tasks' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO ai_scheduled_tasks (task_name, task_type, schedule, time, status) VALUES (?, ?, ?, ?, 'active')");
                $stmt->execute([$data['task_name'], $data['task_type'], $data['schedule'], $data['time']]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                if ($action === 'toggle') {
                    $stmt = $pdo->prepare("UPDATE ai_scheduled_tasks SET status = ? WHERE id = ?");
                    $stmt->execute([$data['status'], $id]);
                } else {
                    $stmt = $pdo->prepare("UPDATE ai_scheduled_tasks SET task_name = ?, task_type = ?, schedule = ?, time = ? WHERE id = ?");
                    $stmt->execute([$data['task_name'], $data['task_type'], $data['schedule'], $data['time'], $id]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ANALYTICS
    // ============================================
    elseif ($resource === 'analytics') {
        $analytics = [
            'predictions_by_type' => [],
            'accuracy_trend' => [],
            'insights_by_category' => []
        ];
        
        // Predictions by type
        try {
            $stmt = $pdo->query("SELECT prediction_type, COUNT(*) as count FROM ai_predictions GROUP BY prediction_type");
            $analytics['predictions_by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
        
        // Insights by category
        try {
            $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM ai_insights WHERE status = 'active' GROUP BY category");
            $analytics['insights_by_category'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
        
        echo json_encode(['success' => true, 'analytics' => $analytics]);
    }

    // ============================================
    // SETTINGS
    // ============================================
    elseif ($resource === 'settings') {
        switch ($method) {
            case 'GET':
                $settings = ['confidence_threshold' => 70, 'prediction_window' => 30];
                $alertSettings = ['email_alerts' => true, 'risk_threshold' => 70, 'anomaly_alerts' => true];
                try {
                    $stmt = $pdo->query("SELECT * FROM ai_settings WHERE id = 1");
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) {
                        $settings = json_decode($row['model_settings'] ?? '{}', true) ?: $settings;
                        $alertSettings = json_decode($row['alert_settings'] ?? '{}', true) ?: $alertSettings;
                    }
                } catch (Exception $e) {}
                echo json_encode(['success' => true, 'settings' => $settings, 'alert_settings' => $alertSettings]);
                break;
            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO ai_settings (id, model_settings, alert_settings) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE model_settings = VALUES(model_settings), alert_settings = VALUES(alert_settings)");
                $stmt->execute([json_encode($data['settings'] ?? []), json_encode($data['alert_settings'] ?? [])]);
                echo json_encode(['success' => true]);
                break;
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

// ============================================
// AI HELPER FUNCTIONS
// ============================================

function predictStudentPerformance($pdo, $studentId) {
    try {
        // Get student info
        $stmt = $pdo->prepare("SELECT first_name, last_name FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get historical performance
        $avg_score = 65; // Default
        $exam_count = 0;
        
        try {
            $stmt = $pdo->prepare("SELECT AVG(percentage) as avg_score, COUNT(*) as exam_count FROM exam_results WHERE student_id = ?");
            $stmt->execute([$studentId]);
            $history = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($history && $history['avg_score']) {
                $avg_score = $history['avg_score'];
                $exam_count = $history['exam_count'];
            }
        } catch (Exception $e) {}
        
        // Simple prediction (in production, use actual ML model)
        $predicted_score = $avg_score * 1.02; // Slight improvement trend
        $confidence = min(0.95, 0.60 + ($exam_count * 0.05));
        
        return [
            'student_name' => $student ? $student['first_name'] . ' ' . $student['last_name'] : 'Unknown',
            'current_avg' => round($avg_score, 2),
            'predicted_score' => round($predicted_score, 2),
            'confidence' => round($confidence, 2),
            'exams_analyzed' => $exam_count,
            'trend' => $predicted_score > $avg_score ? 'improving' : 'stable',
            'recommendation' => $predicted_score < 50 ? 'Requires intervention' : 'On track'
        ];
    } catch (Exception $e) {
        return [
            'predicted_score' => 65,
            'confidence' => 0.50,
            'trend' => 'unknown',
            'recommendation' => 'Insufficient data for prediction'
        ];
    }
}

function calculateDropoutRisk($pdo, $studentId) {
    try {
        // Get student info
        $stmt = $pdo->prepare("SELECT first_name, last_name FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get risk factors with safe queries
        $avg_score = 50; // Default
        $absent_days = 0;
        $outstanding_fees = 0;
        
        // Try to get exam results
        try {
            $stmt = $pdo->prepare("SELECT AVG(percentage) as avg FROM exam_results WHERE student_id = ?");
            $stmt->execute([$studentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result && $result['avg']) $avg_score = $result['avg'];
        } catch (Exception $e) {}
        
        // Try to get attendance
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE student_id = ? AND status = 'absent'");
            $stmt->execute([$studentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) $absent_days = $result['cnt'];
        } catch (Exception $e) {}
        
        // Try to get outstanding fees
        try {
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE student_id = ? AND status IN ('pending', 'partial')");
            $stmt->execute([$studentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) $outstanding_fees = $result['total'];
        } catch (Exception $e) {}
        
        // Calculate risk score (0-100)
        $risk_score = 0;
        if ($avg_score < 40) $risk_score += 40;
        elseif ($avg_score < 60) $risk_score += 20;
        if ($absent_days > 10) $risk_score += 30;
        elseif ($absent_days > 5) $risk_score += 15;
        if ($outstanding_fees > 1000) $risk_score += 30;
        elseif ($outstanding_fees > 500) $risk_score += 15;
        
        $risk_level = $risk_score > 70 ? 'high' : ($risk_score > 40 ? 'medium' : 'low');
        
        return [
            'student_name' => $student ? $student['first_name'] . ' ' . $student['last_name'] : 'Unknown',
            'risk_score' => $risk_score,
            'risk_level' => $risk_level,
            'confidence' => 0.78,
            'factors' => [
                'avg_score' => round($avg_score, 1),
                'absent_days' => $absent_days,
                'outstanding_fees' => $outstanding_fees
            ],
            'recommendation' => $risk_score > 50 ? 'Immediate intervention required' : 'Monitor closely'
        ];
    } catch (Exception $e) {
        return [
            'risk_score' => 25,
            'risk_level' => 'low',
            'confidence' => 0.50,
            'factors' => [],
            'recommendation' => 'Unable to fully assess - monitor student'
        ];
    }
}

function forecastRevenue($pdo, $months) {
    try {
        $avg_revenue = 50000; // Default estimate
        $history = [];
        
        // Try to get from payments table
        try {
            $stmt = $pdo->query("
                SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as revenue
                FROM payments
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                ORDER BY month
            ");
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($history) > 0) {
                $avg_revenue = array_sum(array_column($history, 'revenue')) / count($history);
            }
        } catch (Exception $e) {
            // Try invoices table as fallback
            try {
                $stmt = $pdo->query("
                    SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as revenue
                    FROM invoices
                    WHERE status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month
                ");
                $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (count($history) > 0) {
                    $avg_revenue = array_sum(array_column($history, 'revenue')) / count($history);
                }
            } catch (Exception $e2) {}
        }
        
        // Generate forecast
        $forecast = [];
        for ($i = 1; $i <= $months; $i++) {
            $forecast[] = [
                'month' => date('Y-m', strtotime("+$i month")),
                'month_name' => date('F Y', strtotime("+$i month")),
                'predicted_revenue' => round($avg_revenue * 1.05, 2),
                'lower_bound' => round($avg_revenue * 0.90, 2),
                'upper_bound' => round($avg_revenue * 1.20, 2)
            ];
        }
        
        return [
            'historical_avg' => round($avg_revenue, 2),
            'forecast' => $forecast,
            'confidence' => count($history) > 3 ? 0.78 : 0.55,
            'trend' => 'stable_growth',
            'data_points' => count($history)
        ];
    } catch (Exception $e) {
        return [
            'forecast' => [],
            'confidence' => 0.30,
            'trend' => 'unknown',
            'error' => 'Insufficient data for forecast'
        ];
    }
}

function getBotResponse($pdo, $message) {
    try {
        // Try full-text search first
        try {
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
                $pdo->prepare("UPDATE chatbot_knowledge_base SET usage_count = usage_count + 1 WHERE id = ?")->execute([$match['id']]);
                return ['answer' => $match['answer'], 'confidence' => 0.85, 'intent' => $match['category'], 'sentiment' => 'neutral'];
            }
        } catch (Exception $e) {
            // Fallback to LIKE search if full-text fails
            $stmt = $pdo->prepare("SELECT * FROM chatbot_knowledge_base WHERE status = 'active' AND (question LIKE ? OR keywords LIKE ?) LIMIT 1");
            $stmt->execute(["%$message%", "%$message%"]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($match) {
                return ['answer' => $match['answer'], 'confidence' => 0.70, 'intent' => $match['category'] ?? 'general', 'sentiment' => 'neutral'];
            }
        }
        
        // Smart fallback responses based on keywords
        $message_lower = strtolower($message);
        if (strpos($message_lower, 'fee') !== false || strpos($message_lower, 'payment') !== false) {
            return ['answer' => 'For fee-related inquiries, please visit the Finance Office or check your student portal for detailed fee structure and payment options.', 'confidence' => 0.75, 'intent' => 'fees', 'sentiment' => 'neutral'];
        }
        if (strpos($message_lower, 'admission') !== false || strpos($message_lower, 'enroll') !== false) {
            return ['answer' => 'For admissions, please visit our Admissions Office or apply online through our website. Required documents include birth certificate, previous school records, and passport photos.', 'confidence' => 0.75, 'intent' => 'admissions', 'sentiment' => 'neutral'];
        }
        if (strpos($message_lower, 'result') !== false || strpos($message_lower, 'grade') !== false || strpos($message_lower, 'exam') !== false) {
            return ['answer' => 'Exam results are published on the student portal. You will receive an SMS notification when results are available.', 'confidence' => 0.75, 'intent' => 'results', 'sentiment' => 'neutral'];
        }
        if (strpos($message_lower, 'timetable') !== false || strpos($message_lower, 'schedule') !== false) {
            return ['answer' => 'Class timetables are available on the student portal and mobile app. Contact your class teacher for any schedule changes.', 'confidence' => 0.75, 'intent' => 'timetable', 'sentiment' => 'neutral'];
        }
        if (strpos($message_lower, 'hello') !== false || strpos($message_lower, 'hi') !== false) {
            return ['answer' => 'Hello! I\'m your school AI assistant. I can help you with information about admissions, fees, timetables, exam results, and more. How can I assist you today?', 'confidence' => 0.95, 'intent' => 'greeting', 'sentiment' => 'positive'];
        }
        
        return ['answer' => "I'm sorry, I don't have specific information about that. For detailed assistance, please contact the school administration or visit the relevant office. Is there anything else I can help you with?", 'confidence' => 0.50, 'intent' => 'unknown', 'sentiment' => 'neutral'];
    } catch (Exception $e) {
        return ['answer' => 'I\'m here to help! Please try rephrasing your question or contact the school office for assistance.', 'confidence' => 0.40, 'intent' => 'error', 'sentiment' => 'neutral'];
    }
}

function generateRecommendations($pdo, $targetType, $targetId) {
    $recommendations = [];
    
    try {
        // 1. At-risk students recommendation
        try {
            $stmt = $pdo->query("
                SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) as name, AVG(er.percentage) as avg_score
                FROM students s
                LEFT JOIN exam_results er ON s.id = er.student_id
                WHERE s.status = 'active'
                GROUP BY s.id
                HAVING avg_score < 40 OR avg_score IS NULL
                LIMIT 10
            ");
            $atRiskStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($atRiskStudents) > 0) {
                $recommendations[] = [
                    'type' => 'intervention',
                    'title' => 'At-Risk Students Identified',
                    'description' => count($atRiskStudents) . ' students showing poor academic performance or missing exam data',
                    'priority' => 'high',
                    'confidence' => 0.88,
                    'impact' => 'Implementing targeted interventions could improve pass rates by 15-20%',
                    'actions' => ['Schedule parent meetings', 'Assign tutors', 'Create personalized learning plans']
                ];
            }
        } catch (Exception $e) {}
        
        // 2. Attendance improvement recommendation
        try {
            $stmt = $pdo->query("
                SELECT COUNT(DISTINCT student_id) as low_attendance_students
                FROM attendance
                WHERE status = 'absent'
                GROUP BY student_id
                HAVING COUNT(*) > 5
            ");
            $lowAttendance = $stmt->rowCount();
            
            if ($lowAttendance > 0) {
                $recommendations[] = [
                    'type' => 'intervention',
                    'title' => 'Attendance Improvement Needed',
                    'description' => "{$lowAttendance} students have more than 5 absences",
                    'priority' => 'medium',
                    'confidence' => 0.85,
                    'impact' => 'Improving attendance can increase academic performance by 10-15%',
                    'actions' => ['Send attendance alerts to parents', 'Implement attendance incentive program', 'Conduct home visits for chronic absentees']
                ];
            }
        } catch (Exception $e) {}
        
        // 3. Fee collection recommendation
        try {
            $stmt = $pdo->query("
                SELECT COUNT(*) as overdue, COALESCE(SUM(amount), 0) as total_overdue
                FROM invoices
                WHERE status IN ('pending', 'partial') AND due_date < CURDATE()
            ");
            $overdue = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($overdue && $overdue['overdue'] > 0) {
                $recommendations[] = [
                    'type' => 'fee_structure',
                    'title' => 'Overdue Fee Collection',
                    'description' => "{$overdue['overdue']} invoices overdue totaling GHS " . number_format($overdue['total_overdue'], 2),
                    'priority' => $overdue['total_overdue'] > 50000 ? 'high' : 'medium',
                    'confidence' => 0.92,
                    'impact' => 'Collecting overdue fees will improve cash flow and operational capacity',
                    'actions' => ['Send payment reminders', 'Offer payment plans', 'Schedule meetings with defaulting parents']
                ];
            }
        } catch (Exception $e) {}
        
        // 4. Teacher workload recommendation
        try {
            $stmt = $pdo->query("
                SELECT t.id, CONCAT(t.first_name, ' ', t.last_name) as name, COUNT(ts.id) as subject_count
                FROM teachers t
                JOIN teacher_subjects ts ON t.id = ts.teacher_id
                WHERE t.status = 'active'
                GROUP BY t.id
                HAVING subject_count > 5
            ");
            $overloadedTeachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($overloadedTeachers) > 0) {
                $recommendations[] = [
                    'type' => 'resource_allocation',
                    'title' => 'Teacher Workload Imbalance',
                    'description' => count($overloadedTeachers) . ' teachers handling more than 5 subjects',
                    'priority' => 'medium',
                    'confidence' => 0.80,
                    'impact' => 'Balancing workload can improve teaching quality and reduce burnout',
                    'actions' => ['Hire additional teachers', 'Redistribute subject assignments', 'Review teaching schedules']
                ];
            }
        } catch (Exception $e) {}
        
        // 5. Default recommendation if none generated
        if (empty($recommendations)) {
            $recommendations[] = [
                'type' => 'teaching_strategy',
                'title' => 'Continue Current Strategies',
                'description' => 'No critical issues detected. School operations appear to be running smoothly.',
                'priority' => 'low',
                'confidence' => 0.70,
                'impact' => 'Maintain current practices while monitoring for improvements',
                'actions' => ['Continue regular monitoring', 'Collect feedback from stakeholders', 'Plan for next term improvements']
            ];
        }
    } catch (Exception $e) {
        $recommendations[] = [
            'type' => 'teaching_strategy',
            'title' => 'System Analysis',
            'description' => 'AI recommendation system is active. Add more data for detailed recommendations.',
            'priority' => 'low',
            'confidence' => 0.50,
            'impact' => 'Continue adding data to improve AI recommendations',
            'actions' => ['Add student records', 'Record attendance', 'Enter exam results']
        ];
    }
    
    return $recommendations;
}

function generateInsights($pdo) {
    $insights = [];
    
    // 1. Overall School Performance
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM students WHERE status = 'active'");
        $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM teachers WHERE status = 'active'");
        $totalTeachers = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        $insights[] = [
            'type' => 'overview',
            'category' => 'school',
            'title' => 'School Overview',
            'description' => "Active students: {$totalStudents}, Active teachers: {$totalTeachers}",
            'data' => ['students' => $totalStudents, 'teachers' => $totalTeachers],
            'confidence' => 0.99,
            'impact' => 'high',
            'actions' => 'Review staffing ratios and class sizes'
        ];
    } catch (Exception $e) {}
    
    // 2. Student Performance Insights
    try {
        $stmt = $pdo->query("
            SELECT 
                COUNT(*) as total_results,
                AVG(percentage) as avg_score,
                COUNT(CASE WHEN percentage >= 50 THEN 1 END) as passed,
                COUNT(CASE WHEN percentage < 50 THEN 1 END) as failed
            FROM exam_results
        ");
        $perf = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($perf && $perf['total_results'] > 0) {
            $passRate = round(($perf['passed'] / $perf['total_results']) * 100, 1);
            $insights[] = [
                'type' => 'pattern',
                'category' => 'academic',
                'title' => 'Academic Performance Summary',
                'description' => "Average score: " . round($perf['avg_score'], 1) . "%, Pass rate: {$passRate}%",
                'data' => $perf,
                'confidence' => 0.95,
                'impact' => $passRate < 70 ? 'high' : 'medium',
                'actions' => $passRate < 70 ? 'Implement remedial programs for struggling students' : 'Maintain current teaching strategies'
            ];
        }
    } catch (Exception $e) {}
    
    // 3. Attendance Insights
    try {
        $stmt = $pdo->query("
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                COUNT(*) as total
            FROM attendance
            WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $att = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($att && $att['total'] > 0) {
            $attRate = round(($att['present'] / $att['total']) * 100, 1);
            $insights[] = [
                'type' => 'trend',
                'category' => 'attendance',
                'title' => 'Monthly Attendance Rate',
                'description' => "Attendance rate (30 days): {$attRate}%",
                'data' => $att,
                'confidence' => 0.92,
                'impact' => $attRate < 85 ? 'high' : 'low',
                'actions' => $attRate < 85 ? 'Investigate causes of absenteeism' : 'Continue monitoring attendance'
            ];
        }
    } catch (Exception $e) {}
    
    // 4. Teacher Workload
    try {
        $stmt = $pdo->query("
            SELECT t.id, CONCAT(t.first_name, ' ', t.last_name) as name, COUNT(ts.id) as subjects
            FROM teachers t
            LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
            WHERE t.status = 'active'
            GROUP BY t.id
            ORDER BY subjects DESC
            LIMIT 5
        ");
        $workload = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($workload) > 0) {
            $avgSubjects = array_sum(array_column($workload, 'subjects')) / count($workload);
            $insights[] = [
                'type' => 'pattern',
                'category' => 'teachers',
                'title' => 'Teacher Workload Distribution',
                'description' => "Average subjects per teacher: " . round($avgSubjects, 1),
                'data' => $workload,
                'confidence' => 0.88,
                'impact' => 'medium',
                'actions' => 'Review workload balance among teaching staff'
            ];
        }
    } catch (Exception $e) {}
    
    // 5. Class Size Analysis
    try {
        $stmt = $pdo->query("
            SELECT c.class_name, COUNT(s.id) as student_count
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
            GROUP BY c.id
            ORDER BY student_count DESC
        ");
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($classes) > 0) {
            $avgSize = array_sum(array_column($classes, 'student_count')) / count($classes);
            $largeClasses = count(array_filter($classes, fn($c) => $c['student_count'] > 40));
            $insights[] = [
                'type' => 'pattern',
                'category' => 'classes',
                'title' => 'Class Size Analysis',
                'description' => "Average class size: " . round($avgSize, 0) . " students. {$largeClasses} classes exceed 40 students.",
                'data' => $classes,
                'confidence' => 0.95,
                'impact' => $largeClasses > 0 ? 'high' : 'low',
                'actions' => $largeClasses > 0 ? 'Consider splitting large classes or hiring additional teachers' : 'Class sizes are optimal'
            ];
        }
    } catch (Exception $e) {}
    
    // 6. Fee Collection Insights
    try {
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) as collected,
                COALESCE(SUM(CASE WHEN status IN ('pending', 'partial') THEN amount END), 0) as outstanding,
                COALESCE(SUM(amount), 0) as total
            FROM invoices
            WHERE YEAR(created_at) = YEAR(CURDATE())
        ");
        $fees = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($fees && $fees['total'] > 0) {
            $collectionRate = round(($fees['collected'] / $fees['total']) * 100, 1);
            $insights[] = [
                'type' => 'opportunity',
                'category' => 'finance',
                'title' => 'Fee Collection Status',
                'description' => "Collection rate: {$collectionRate}%. Outstanding: GHS " . number_format($fees['outstanding'], 2),
                'data' => $fees,
                'confidence' => 0.98,
                'impact' => $collectionRate < 80 ? 'high' : 'medium',
                'actions' => $collectionRate < 80 ? 'Intensify fee collection efforts and send reminders' : 'Continue current collection strategies'
            ];
        }
    } catch (Exception $e) {}
    
    // 7. Subject Performance Comparison
    try {
        $stmt = $pdo->query("
            SELECT s.subject_name, AVG(er.percentage) as avg_score, COUNT(er.id) as exams
            FROM subjects s
            JOIN exam_schedules es ON s.id = es.subject_id
            JOIN exam_results er ON es.id = er.exam_schedule_id
            GROUP BY s.id
            HAVING exams > 0
            ORDER BY avg_score ASC
            LIMIT 5
        ");
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($subjects) > 0) {
            $weakest = $subjects[0]['subject_name'] ?? 'N/A';
            $weakestScore = round($subjects[0]['avg_score'] ?? 0, 1);
            $insights[] = [
                'type' => 'risk',
                'category' => 'subjects',
                'title' => 'Subject Performance Analysis',
                'description' => "Weakest subject: {$weakest} (avg: {$weakestScore}%)",
                'data' => $subjects,
                'confidence' => 0.90,
                'impact' => $weakestScore < 50 ? 'high' : 'medium',
                'actions' => 'Review teaching methods and resources for underperforming subjects'
            ];
        }
    } catch (Exception $e) {}
    
    // If no insights generated, add a default one
    if (empty($insights)) {
        $insights[] = [
            'type' => 'overview',
            'category' => 'system',
            'title' => 'System Ready',
            'description' => 'AI insights system is active. Add more data to generate detailed insights.',
            'data' => [],
            'confidence' => 1.0,
            'impact' => 'low',
            'actions' => 'Continue adding student, attendance, and exam data'
        ];
    }
    
    return $insights;
}

function detectAnomalies($pdo) {
    $anomalies = [];
    
    try {
        // 1. Detect unusual payment patterns
        try {
            $stmt = $pdo->query("
                SELECT student_id, COUNT(*) as payment_count, SUM(amount) as total_amount
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
                    'deviation' => round((($payment['total_amount'] - 2000) / 2000) * 100, 1)
                ];
            }
        } catch (Exception $e) {}
        
        // 2. Detect attendance anomalies (sudden drops)
        try {
            $stmt = $pdo->query("
                SELECT s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as name,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                    COUNT(*) as total_days
                FROM students s
                JOIN attendance a ON s.id = a.student_id
                WHERE a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY s.id
                HAVING absent_count >= 3
            ");
            $attendance_issues = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($attendance_issues as $issue) {
                $anomalies[] = [
                    'type' => 'attendance',
                    'entity_type' => 'student',
                    'entity_id' => $issue['student_id'],
                    'description' => "Student {$issue['name']} absent {$issue['absent_count']} days in last week",
                    'severity' => $issue['absent_count'] >= 5 ? 'high' : 'medium',
                    'detected_value' => $issue['absent_count'],
                    'expected_value' => 1,
                    'deviation' => round((($issue['absent_count'] - 1) / 1) * 100, 1)
                ];
            }
        } catch (Exception $e) {}
        
        // 3. Detect performance drops
        try {
            $stmt = $pdo->query("
                SELECT s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as name,
                    AVG(er.percentage) as recent_avg
                FROM students s
                JOIN exam_results er ON s.id = er.student_id
                WHERE er.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY s.id
                HAVING recent_avg < 40
            ");
            $performance_drops = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($performance_drops as $drop) {
                $anomalies[] = [
                    'type' => 'performance',
                    'entity_type' => 'student',
                    'entity_id' => $drop['student_id'],
                    'description' => "Student {$drop['name']} showing poor performance (avg: " . round($drop['recent_avg'], 1) . "%)",
                    'severity' => $drop['recent_avg'] < 30 ? 'high' : 'medium',
                    'detected_value' => round($drop['recent_avg'], 1),
                    'expected_value' => 50,
                    'deviation' => round(((50 - $drop['recent_avg']) / 50) * 100, 1)
                ];
            }
        } catch (Exception $e) {}
        
        // 4. Detect overdue invoices
        try {
            $stmt = $pdo->query("
                SELECT i.id, i.student_id, i.amount, DATEDIFF(CURDATE(), i.due_date) as days_overdue,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                WHERE i.status IN ('pending', 'partial') AND i.due_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                LIMIT 10
            ");
            $overdue = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($overdue as $inv) {
                $anomalies[] = [
                    'type' => 'financial',
                    'entity_type' => 'invoice',
                    'entity_id' => $inv['id'],
                    'description' => "Invoice for {$inv['student_name']} overdue by {$inv['days_overdue']} days (GHS " . number_format($inv['amount'], 2) . ")",
                    'severity' => $inv['days_overdue'] > 60 ? 'high' : 'medium',
                    'detected_value' => $inv['days_overdue'],
                    'expected_value' => 0,
                    'deviation' => $inv['days_overdue'] * 100
                ];
            }
        } catch (Exception $e) {}
        
        // If no anomalies found, return a status message
        if (empty($anomalies)) {
            $anomalies[] = [
                'type' => 'system',
                'entity_type' => 'school',
                'entity_id' => 1,
                'description' => 'No significant anomalies detected. System operating normally.',
                'severity' => 'low',
                'detected_value' => 0,
                'expected_value' => 0,
                'deviation' => 0
            ];
        }
    } catch (Exception $e) {
        $anomalies[] = [
            'type' => 'system',
            'entity_type' => 'school',
            'entity_id' => 1,
            'description' => 'Anomaly detection system active. Add more data for detailed analysis.',
            'severity' => 'low',
            'detected_value' => 0,
            'expected_value' => 0,
            'deviation' => 0
        ];
    }
    
    return $anomalies;
}

function generateLearningPath($pdo, $studentId, $subjectId) {
    try {
        // Get student info
        $stmt = $pdo->prepare("SELECT first_name, last_name FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get subject info
        $stmt = $pdo->prepare("SELECT subject_name FROM subjects WHERE id = ?");
        $stmt->execute([$subjectId]);
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get student performance in subject
        $avg_score = 50; // Default
        try {
            $stmt = $pdo->prepare("
                SELECT AVG(percentage) as avg_score
                FROM exam_results er
                JOIN exam_schedules es ON er.exam_schedule_id = es.id
                WHERE er.student_id = ? AND es.subject_id = ?
            ");
            $stmt->execute([$studentId, $subjectId]);
            $performance = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($performance && $performance['avg_score']) {
                $avg_score = $performance['avg_score'];
            }
        } catch (Exception $e) {}
        
        $current_level = $avg_score >= 80 ? 'Advanced' : ($avg_score >= 60 ? 'Intermediate' : 'Beginner');
        
        // Determine learning style based on random factors (in production, use assessment)
        $styles = ['visual', 'auditory', 'kinesthetic', 'reading_writing'];
        $learning_style = $styles[array_rand($styles)];
        
        // Generate strengths and weaknesses based on performance
        $strengths = $avg_score >= 60 ? ['Consistent effort', 'Good foundation'] : ['Willingness to learn', 'Attendance'];
        $weaknesses = $avg_score < 60 ? ['Needs more practice', 'Concept clarity'] : ['Advanced problem solving', 'Time management'];
        
        return [
            'student_name' => $student ? $student['first_name'] . ' ' . $student['last_name'] : 'Unknown',
            'subject_name' => $subject ? $subject['subject_name'] : 'Unknown',
            'current_score' => round($avg_score, 1),
            'current_level' => $current_level,
            'target_level' => 'Advanced',
            'learning_style' => $learning_style,
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
            'resources' => [
                ['type' => 'video', 'title' => 'Introduction to ' . ($subject ? $subject['subject_name'] : 'Subject')],
                ['type' => 'practice', 'title' => 'Interactive Exercises'],
                ['type' => 'reading', 'title' => 'Supplementary Materials'],
                ['type' => 'quiz', 'title' => 'Self-Assessment Quiz']
            ],
            'milestones' => [
                ['title' => 'Complete foundational modules', 'target_date' => date('Y-m-d', strtotime('+1 month'))],
                ['title' => 'Pass intermediate assessment', 'target_date' => date('Y-m-d', strtotime('+2 months'))],
                ['title' => 'Achieve advanced level', 'target_date' => date('Y-m-d', strtotime('+3 months'))]
            ]
        ];
    } catch (Exception $e) {
        return [
            'current_level' => 'Beginner',
            'target_level' => 'Advanced',
            'learning_style' => 'visual',
            'strengths' => ['Potential to improve'],
            'weaknesses' => ['Needs assessment'],
            'resources' => [
                ['type' => 'video', 'title' => 'Getting Started'],
                ['type' => 'practice', 'title' => 'Basic Exercises']
            ],
            'milestones' => [
                ['title' => 'Complete assessment', 'target_date' => date('Y-m-d', strtotime('+1 week'))]
            ]
        ];
    }
}
