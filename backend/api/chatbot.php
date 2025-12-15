<?php
/**
 * AI Chatbot API
 * Handles FAQ queries with multi-language support and intelligent responses
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

// Multi-language translations
$TRANSLATIONS = [
    'twi' => [
        'hello' => 'Akwaaba! Meyɛ wo boafo. Dɛn na metumi aboa wo?',
        'thanks' => 'Meda wo ase! Biribi foforo wɔ hɔ a metumi aboa wo?',
        'fees' => 'Wo betumi ahwɛ wo fees wɔ Finance section mu.',
        'attendance' => 'Wo betumi ahwɛ attendance wɔ Dashboard mu.',
        'results' => 'Wo betumi ahwɛ results wɔ Results section mu.',
        'help' => 'Metumi aboa wo wɔ fees, attendance, results, homework, ne nea ɛkeka ho ho.',
        'default' => 'Mete aseɛ. Bisa me fees, attendance, results, anaa homework ho.'
    ],
    'ga' => [
        'hello' => 'Ojekoo! Miye wo helper. Mɛnɛ lɛ maba bo wo?',
        'thanks' => 'Oyiwaladon! Shwɛmɔ foforo ko ni maba bo wo?',
        'fees' => 'Obatɛ kɛ fees wɔ Finance section mli.',
        'attendance' => 'Obatɛ kɛ attendance wɔ Dashboard mli.',
        'results' => 'Obatɛ kɛ results wɔ Results section mli.',
        'help' => 'Maba bo wo kɛ fees, attendance, results, homework, kɛ shwɛmɔ foforo.',
        'default' => 'Miba. Bisa mi fees, attendance, results, alo homework.'
    ],
    'ewe' => [
        'hello' => 'Woezɔ! Nye kpɔdenyewo. Aleke makpe ɖe ŋuwò?',
        'thanks' => 'Akpe! Nu bubu aɖe le esi makpe ɖe ŋuwò le eŋu?',
        'fees' => 'Àte ŋu akpɔ wò fees le Finance section me.',
        'attendance' => 'Àte ŋu akpɔ attendance le Dashboard me.',
        'results' => 'Àte ŋu akpɔ results le Results section me.',
        'help' => 'Mate ŋu akpe ɖe ŋuwò le fees, attendance, results, homework ŋu.',
        'default' => 'Mese. Bia nu fees, attendance, results, alo homework ŋu.'
    ]
];

// Language detection keywords
$LANGUAGE_KEYWORDS = [
    'twi' => ['akwaaba', 'mepaakyew', 'medaase', 'mepa wo kyɛw', 'yɛfrɛ', 'ɛte sɛn', 'wo ho te sɛn'],
    'ga' => ['ojekoo', 'oyiwaladon', 'mɛnɛ', 'akɛ', 'obatɛ'],
    'ewe' => ['woezɔ', 'akpe', 'aleke', 'ŋuwò', 'àte']
];

// FAQ Knowledge Base
$FAQ_DATABASE = [
    'fee' => [
        'keywords' => ['fee', 'fees', 'payment', 'pay', 'cost', 'tuition', 'amount', 'how much', 'invoice'],
        'responses' => [
            "To view your fees, go to the Finance section in your dashboard.",
            "You can pay fees online through Mobile Money (MTN, Vodafone, AirtelTigo) or card payment.",
            "For fee inquiries, please contact the accounts office or check your invoice in the Payments section."
        ]
    ],
    'attendance' => [
        'keywords' => ['attendance', 'absent', 'present', 'late', 'missed', 'class attendance'],
        'responses' => [
            "You can view attendance records in the Dashboard or Child Details section.",
            "If your child is absent, please inform the school through the Messages section or call the office.",
            "Attendance is marked daily by class teachers. You'll receive notifications for any absences."
        ]
    ],
    'results' => [
        'keywords' => ['result', 'results', 'grade', 'grades', 'score', 'marks', 'exam', 'report card'],
        'responses' => [
            "View results in the 'Results' section of your portal.",
            "Report cards are published at the end of each term. You'll receive a notification when they're ready.",
            "For grade inquiries, please message the subject teacher through the Messages section."
        ]
    ],
    'homework' => [
        'keywords' => ['homework', 'assignment', 'assignments', 'task', 'project', 'due'],
        'responses' => [
            "Check the Homework section to see all pending and completed assignments.",
            "Homework is assigned by teachers with due dates. You'll receive notifications for new assignments.",
            "If you have questions about homework, message the teacher directly through the app."
        ]
    ],
    'timetable' => [
        'keywords' => ['timetable', 'schedule', 'class time', 'period', 'when is'],
        'responses' => [
            "The class timetable is available in the Timetable section of the dashboard.",
            "Timetables show daily class schedules including subjects, teachers, and room numbers.",
            "Any changes to the timetable will be notified through the app."
        ]
    ],
    'transport' => [
        'keywords' => ['bus', 'transport', 'pick up', 'drop', 'route', 'driver'],
        'responses' => [
            "Track your child's school bus in real-time through the Transport section.",
            "Bus routes and schedules are available in the Transport module.",
            "For transport issues, contact the transport coordinator through Messages."
        ]
    ],
    'message' => [
        'keywords' => ['message', 'contact', 'teacher', 'communicate', 'talk', 'reach', 'email'],
        'responses' => [
            "Use the Messages section to communicate with teachers and school administration.",
            "You can send messages to any teacher or the admin office directly from the app.",
            "All messages are saved in your inbox for future reference."
        ]
    ],
    'admission' => [
        'keywords' => ['admission', 'enroll', 'enrolment', 'register', 'new student', 'apply', 'join'],
        'responses' => [
            "To apply for admission, go to 'Apply for Admission' in the Parent Portal.",
            "Required documents: Birth certificate, previous school records, passport photos.",
            "Admission applications are reviewed within 5-7 working days."
        ]
    ],
    'help' => [
        'keywords' => ['help', 'support', 'assist', 'how to', 'guide', 'what can'],
        'responses' => [
            "I can help you with: fees, attendance, results, homework, timetable, transport, and messaging.",
            "For technical issues, please contact support@school.com or call the IT helpdesk.",
            "Use the search bar at the top to quickly find any feature in the app."
        ]
    ],
    'greeting' => [
        'keywords' => ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
        'responses' => [
            "Hello! 👋 I'm your school assistant. How can I help you today?",
            "Hi there! I can help you with fees, attendance, results, homework, and more. What do you need?",
            "Welcome! Ask me anything about the school management system."
        ]
    ],
    'thanks' => [
        'keywords' => ['thank', 'thanks', 'thank you', 'appreciate', 'helpful'],
        'responses' => [
            "You're welcome! Is there anything else I can help you with?",
            "Happy to help! Feel free to ask if you have more questions.",
            "Anytime! Don't hesitate to reach out if you need more assistance."
        ]
    ]
];

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $query = strtolower($data['query'] ?? '');
    $userId = $data['user_id'] ?? null;
    $userType = $data['user_type'] ?? 'parent';
    $preferredLanguage = $data['language'] ?? 'en';

    if (empty($query)) {
        echo json_encode([
            'success' => true,
            'response' => "I didn't catch that. Could you please rephrase your question?",
            'language' => 'en'
        ]);
        exit;
    }

    // Detect language from query
    $detectedLanguage = detectLanguage($query, $LANGUAGE_KEYWORDS);
    $responseLanguage = $detectedLanguage ?: $preferredLanguage;

    // Find matching response
    $response = null;
    $category = null;
    
    // If local language detected, try to respond in that language
    if ($detectedLanguage && isset($TRANSLATIONS[$detectedLanguage])) {
        $category = detectCategory($query, $FAQ_DATABASE);
        if ($category && isset($TRANSLATIONS[$detectedLanguage][$category])) {
            $response = $TRANSLATIONS[$detectedLanguage][$category];
        } elseif (preg_match('/hello|hi|hey|akwaaba|ojekoo|woezɔ/', $query)) {
            $response = $TRANSLATIONS[$detectedLanguage]['hello'];
        } elseif (preg_match('/thank|medaase|oyiwaladon|akpe/', $query)) {
            $response = $TRANSLATIONS[$detectedLanguage]['thanks'];
        } else {
            $response = $TRANSLATIONS[$detectedLanguage]['default'];
        }
    }
    
    // Fall back to English FAQ
    if ($response === null) {
        $response = findResponse($query, $FAQ_DATABASE);
        $responseLanguage = 'en';
    }

    // Try to get contextual data if user is logged in
    if ($userId && $response === null) {
        $response = getContextualResponse($pdo, $query, $userId, $userType);
    }

    // Default response if nothing matches
    if ($response === null) {
        $response = "I'm not sure about that. You can ask me about:\n• Fees & Payments\n• Attendance\n• Results & Grades\n• Homework\n• Timetable\n• Transport\n• Messaging\n\nOr contact the school office for specific inquiries.";
    }

    // Log the query for analytics
    logChatQuery($pdo, $userId, $query, $response, $responseLanguage);

    echo json_encode([
        'success' => true,
        'response' => $response,
        'language' => $responseLanguage,
        'detected_language' => $detectedLanguage
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function detectLanguage($query, $languageKeywords) {
    foreach ($languageKeywords as $lang => $keywords) {
        foreach ($keywords as $keyword) {
            if (mb_strpos($query, $keyword) !== false) {
                return $lang;
            }
        }
    }
    return null;
}

function detectCategory($query, $faqDatabase) {
    foreach ($faqDatabase as $category => $data) {
        foreach ($data['keywords'] as $keyword) {
            if (strpos($query, $keyword) !== false) {
                // Map to translation keys
                $categoryMap = [
                    'fee' => 'fees',
                    'attendance' => 'attendance',
                    'results' => 'results',
                    'homework' => 'homework',
                    'help' => 'help',
                    'greeting' => 'hello',
                    'thanks' => 'thanks'
                ];
                return $categoryMap[$category] ?? $category;
            }
        }
    }
    return null;
}

function findResponse($query, $faqDatabase) {
    foreach ($faqDatabase as $category => $data) {
        foreach ($data['keywords'] as $keyword) {
            if (strpos($query, $keyword) !== false) {
                $responses = $data['responses'];
                return $responses[array_rand($responses)];
            }
        }
    }
    return null;
}

function getContextualResponse($pdo, $query, $userId, $userType) {
    // Try to provide contextual responses based on user data
    
    // Check for balance/amount queries
    if (preg_match('/balance|owe|outstanding|due/', $query)) {
        try {
            if ($userType === 'parent') {
                // Get student's outstanding balance
                $stmt = $pdo->prepare("
                    SELECT s.first_name, s.last_name, 
                           COALESCE(SUM(i.total_amount - i.amount_paid), 0) as balance
                    FROM students s
                    LEFT JOIN invoices i ON i.student_id = s.id AND i.status != 'paid'
                    WHERE s.guardian_email = (SELECT email FROM users WHERE id = ?)
                    GROUP BY s.id
                ");
                $stmt->execute([$userId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result) {
                    $balance = number_format($result['balance'], 2);
                    return "The outstanding balance for {$result['first_name']} {$result['last_name']} is GHS {$balance}. You can make a payment through the Payments section.";
                }
            }
        } catch (Exception $e) {}
    }
    
    // Check for next class/today's schedule
    if (preg_match('/next class|today|schedule|what.*class/', $query)) {
        try {
            // This would require timetable data
            return "You can view today's schedule in the Timetable section of your dashboard.";
        } catch (Exception $e) {}
    }
    
    return null;
}

function logChatQuery($pdo, $userId, $query, $response, $language = 'en') {
    try {
        // Create chat_logs table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS chat_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                query TEXT,
                response TEXT,
                language VARCHAR(10) DEFAULT 'en',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Try to add language column if it doesn't exist
        try {
            $pdo->exec("ALTER TABLE chat_logs ADD COLUMN language VARCHAR(10) DEFAULT 'en' AFTER response");
        } catch (Exception $e) {}
        
        $stmt = $pdo->prepare("INSERT INTO chat_logs (user_id, query, response, language) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $query, $response, $language]);
    } catch (Exception $e) {
        // Silently fail
    }
}
