<?php
/**
 * AI API Endpoint
 * Provides AI-powered features: chatbot, content generation, analytics insights
 * Supports OpenAI GPT and Anthropic Claude APIs
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

// Load environment variables for API keys
$envFile = __DIR__ . '/../../.env';
$apiKeys = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $apiKeys[trim($key)] = trim($value);
        }
    }
}

$OPENAI_API_KEY = $apiKeys['OPENAI_API_KEY'] ?? getenv('OPENAI_API_KEY') ?? '';
$ANTHROPIC_API_KEY = $apiKeys['ANTHROPIC_API_KEY'] ?? getenv('ANTHROPIC_API_KEY') ?? '';

class AIService {
    private $openaiKey;
    private $anthropicKey;
    private $pdo;
    
    public function __construct($openaiKey, $anthropicKey, $pdo) {
        $this->openaiKey = $openaiKey;
        $this->anthropicKey = $anthropicKey;
        $this->pdo = $pdo;
    }
    
    /**
     * Chat with AI - supports both OpenAI and Claude
     */
    public function chat($message, $context = [], $provider = 'openai') {
        if ($provider === 'anthropic' && $this->anthropicKey) {
            return $this->chatWithClaude($message, $context);
        } elseif ($this->openaiKey) {
            return $this->chatWithOpenAI($message, $context);
        }
        
        // Fallback to local FAQ if no API keys
        return $this->localFAQResponse($message);
    }
    
    /**
     * OpenAI GPT Chat
     */
    private function chatWithOpenAI($message, $context = []) {
        $systemPrompt = $this->getSystemPrompt($context);
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $message]
        ];
        
        $data = [
            'model' => 'gpt-3.5-turbo',
            'messages' => $messages,
            'max_tokens' => 500,
            'temperature' => 0.7
        ];
        
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->openaiKey
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $result = json_decode($response, true);
            return [
                'success' => true,
                'response' => $result['choices'][0]['message']['content'] ?? 'No response generated',
                'provider' => 'openai'
            ];
        }
        
        return $this->localFAQResponse($message);
    }
    
    /**
     * Anthropic Claude Chat
     */
    private function chatWithClaude($message, $context = []) {
        $systemPrompt = $this->getSystemPrompt($context);
        
        $data = [
            'model' => 'claude-3-haiku-20240307',
            'max_tokens' => 500,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => $message]
            ]
        ];
        
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->anthropicKey,
                'anthropic-version: 2023-06-01'
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $result = json_decode($response, true);
            return [
                'success' => true,
                'response' => $result['content'][0]['text'] ?? 'No response generated',
                'provider' => 'anthropic'
            ];
        }
        
        return $this->localFAQResponse($message);
    }
    
    /**
     * Get system prompt based on context
     */
    private function getSystemPrompt($context) {
        $userType = $context['user_type'] ?? 'guest';
        
        return "You are a helpful AI assistant for McSMS School Management System. 
You help {$userType}s with questions about:
- Fees and payments (Mobile Money, card payments)
- Student attendance and academic results
- Homework and assignments
- Class timetables and schedules
- School transport and bus tracking
- Communication with teachers and staff
- School events and announcements

Be concise, friendly, and helpful. If you don't know something specific, 
suggest contacting the school office or relevant department.
Keep responses under 150 words unless more detail is needed.";
    }
    
    /**
     * Local FAQ fallback when no API keys available
     */
    private function localFAQResponse($message) {
        $message = strtolower($message);
        
        $faqs = [
            'fee' => "To view your fees, go to the Finance section in your dashboard. You can pay via Mobile Money (MTN, Vodafone, AirtelTigo) or card.",
            'payment' => "We accept Mobile Money (MTN MoMo, Vodafone Cash), Visa/Mastercard, and Bank Transfer. Go to Payments → Select Invoice → Pay.",
            'attendance' => "View attendance in the Dashboard or Child Details section. Teachers mark attendance daily.",
            'result' => "Check results in the 'Results' section. Report cards are published at term end.",
            'homework' => "View pending and completed assignments in the Homework section.",
            'timetable' => "Class timetables are in the Timetable section showing subjects, teachers, and rooms.",
            'transport' => "Track school buses in real-time through the Transport section.",
            'message' => "Send messages to teachers through the Messages section in your dashboard.",
            'grade' => "Grades are available in the Results section. Contact subject teachers for inquiries."
        ];
        
        foreach ($faqs as $keyword => $response) {
            if (strpos($message, $keyword) !== false) {
                return [
                    'success' => true,
                    'response' => $response,
                    'provider' => 'local'
                ];
            }
        }
        
        return [
            'success' => true,
            'response' => "I can help you with: Fees & Payments, Attendance, Results, Homework, Timetable, Transport, and Messaging. What would you like to know?",
            'provider' => 'local'
        ];
    }
    
    /**
     * Generate content (lesson plans, reports, etc.)
     */
    public function generateContent($type, $params) {
        $prompts = [
            'lesson_plan' => "Create a lesson plan for {$params['subject']} on the topic '{$params['topic']}' for {$params['grade']} students. Include objectives, activities, and assessment.",
            'report_comment' => "Write a brief, professional teacher comment for a student who scored {$params['score']}% in {$params['subject']}. Mention strengths and areas for improvement.",
            'announcement' => "Write a school announcement about: {$params['topic']}. Keep it professional and informative.",
            'email_template' => "Write a professional email template for: {$params['purpose']}. Include placeholders for personalization."
        ];
        
        $prompt = $prompts[$type] ?? "Generate content for: {$params['description']}";
        
        return $this->chat($prompt, ['user_type' => 'teacher']);
    }
    
    /**
     * Analyze student performance
     */
    public function analyzePerformance($studentId) {
        try {
            // Get student grades
            $stmt = $this->pdo->prepare("
                SELECT s.name as subject, g.score, g.grade, t.name as term
                FROM grades g
                JOIN subjects s ON g.subject_id = s.id
                JOIN terms t ON g.term_id = t.id
                WHERE g.student_id = ?
                ORDER BY t.id DESC, s.name
                LIMIT 20
            ");
            $stmt->execute([$studentId]);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($grades)) {
                return [
                    'success' => true,
                    'analysis' => 'No grade data available for analysis.',
                    'recommendations' => []
                ];
            }
            
            // Calculate statistics
            $scores = array_column($grades, 'score');
            $avgScore = array_sum($scores) / count($scores);
            $maxScore = max($scores);
            $minScore = min($scores);
            
            // Group by subject
            $bySubject = [];
            foreach ($grades as $g) {
                $bySubject[$g['subject']][] = $g['score'];
            }
            
            $strengths = [];
            $weaknesses = [];
            foreach ($bySubject as $subject => $subjectScores) {
                $avg = array_sum($subjectScores) / count($subjectScores);
                if ($avg >= 70) {
                    $strengths[] = $subject;
                } elseif ($avg < 50) {
                    $weaknesses[] = $subject;
                }
            }
            
            return [
                'success' => true,
                'analysis' => [
                    'average_score' => round($avgScore, 1),
                    'highest_score' => $maxScore,
                    'lowest_score' => $minScore,
                    'total_subjects' => count($bySubject),
                    'strengths' => $strengths,
                    'weaknesses' => $weaknesses
                ],
                'recommendations' => $this->generateRecommendations($avgScore, $strengths, $weaknesses)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to analyze performance'
            ];
        }
    }
    
    private function generateRecommendations($avgScore, $strengths, $weaknesses) {
        $recommendations = [];
        
        if ($avgScore >= 80) {
            $recommendations[] = "Excellent performance! Consider advanced or enrichment programs.";
        } elseif ($avgScore >= 60) {
            $recommendations[] = "Good progress. Focus on consistency across all subjects.";
        } else {
            $recommendations[] = "Additional support recommended. Consider tutoring or study groups.";
        }
        
        if (!empty($weaknesses)) {
            $recommendations[] = "Priority subjects for improvement: " . implode(', ', $weaknesses);
        }
        
        if (!empty($strengths)) {
            $recommendations[] = "Strong performance in: " . implode(', ', $strengths);
        }
        
        return $recommendations;
    }
    
    /**
     * Get class insights
     */
    public function getClassInsights($classId) {
        try {
            // Get class performance data
            $stmt = $this->pdo->prepare("
                SELECT 
                    AVG(g.score) as avg_score,
                    COUNT(DISTINCT g.student_id) as student_count,
                    s.name as subject
                FROM grades g
                JOIN subjects s ON g.subject_id = s.id
                JOIN students st ON g.student_id = st.id
                WHERE st.class_id = ?
                GROUP BY s.id
            ");
            $stmt->execute([$classId]);
            $subjectStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get attendance rate
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                    COUNT(*) as total
                FROM attendance a
                JOIN students st ON a.student_id = st.id
                WHERE st.class_id = ? AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ");
            $stmt->execute([$classId]);
            $attendance = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $attendanceRate = $attendance['total'] > 0 
                ? round(($attendance['present'] / $attendance['total']) * 100, 1) 
                : 0;
            
            return [
                'success' => true,
                'insights' => [
                    'subject_performance' => $subjectStats,
                    'attendance_rate' => $attendanceRate,
                    'student_count' => $subjectStats[0]['student_count'] ?? 0
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to get class insights'
            ];
        }
    }
}

// Main request handling
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $ai = new AIService($OPENAI_API_KEY, $ANTHROPIC_API_KEY, $pdo);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $_GET['action'] ?? 'chat';
    
    switch ($action) {
        case 'chat':
            $message = $input['message'] ?? $input['query'] ?? '';
            $context = [
                'user_type' => $input['user_type'] ?? 'guest',
                'user_id' => $input['user_id'] ?? null
            ];
            $provider = $input['provider'] ?? 'openai';
            
            if (empty($message)) {
                echo json_encode(['success' => false, 'error' => 'Message is required']);
                exit;
            }
            
            $result = $ai->chat($message, $context, $provider);
            echo json_encode($result);
            break;
            
        case 'generate':
            $type = $input['type'] ?? 'announcement';
            $params = $input['params'] ?? [];
            
            $result = $ai->generateContent($type, $params);
            echo json_encode($result);
            break;
            
        case 'analyze_student':
            $studentId = $input['student_id'] ?? 0;
            
            if (!$studentId) {
                echo json_encode(['success' => false, 'error' => 'Student ID is required']);
                exit;
            }
            
            $result = $ai->analyzePerformance($studentId);
            echo json_encode($result);
            break;
            
        case 'class_insights':
            $classId = $input['class_id'] ?? 0;
            
            if (!$classId) {
                echo json_encode(['success' => false, 'error' => 'Class ID is required']);
                exit;
            }
            
            $result = $ai->getClassInsights($classId);
            echo json_encode($result);
            break;
            
        case 'status':
            echo json_encode([
                'success' => true,
                'openai_configured' => !empty($OPENAI_API_KEY),
                'anthropic_configured' => !empty($ANTHROPIC_API_KEY),
                'fallback_available' => true
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
