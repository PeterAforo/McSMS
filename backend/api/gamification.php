<?php
/**
 * Gamification API
 * Handles badges, XP points, achievements, and leaderboards
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

// Badge definitions
$BADGES = [
    // Attendance badges
    'perfect_attendance_week' => [
        'id' => 'perfect_attendance_week',
        'name' => 'Perfect Week',
        'description' => 'Attended all classes for a week',
        'icon' => '🌟',
        'category' => 'attendance',
        'xp' => 50,
        'rarity' => 'common'
    ],
    'perfect_attendance_month' => [
        'id' => 'perfect_attendance_month',
        'name' => 'Perfect Month',
        'description' => 'Attended all classes for a month',
        'icon' => '⭐',
        'category' => 'attendance',
        'xp' => 200,
        'rarity' => 'rare'
    ],
    'perfect_attendance_term' => [
        'id' => 'perfect_attendance_term',
        'name' => 'Attendance Champion',
        'description' => 'Perfect attendance for the entire term',
        'icon' => '🏆',
        'category' => 'attendance',
        'xp' => 500,
        'rarity' => 'legendary'
    ],
    'early_bird' => [
        'id' => 'early_bird',
        'name' => 'Early Bird',
        'description' => 'Arrived early to school 10 times',
        'icon' => '🐦',
        'category' => 'attendance',
        'xp' => 100,
        'rarity' => 'uncommon'
    ],
    
    // Academic badges
    'first_a' => [
        'id' => 'first_a',
        'name' => 'First A',
        'description' => 'Scored an A grade for the first time',
        'icon' => '📚',
        'category' => 'academic',
        'xp' => 100,
        'rarity' => 'common'
    ],
    'honor_roll' => [
        'id' => 'honor_roll',
        'name' => 'Honor Roll',
        'description' => 'Achieved A grades in all subjects',
        'icon' => '🎓',
        'category' => 'academic',
        'xp' => 500,
        'rarity' => 'legendary'
    ],
    'math_wizard' => [
        'id' => 'math_wizard',
        'name' => 'Math Wizard',
        'description' => 'Scored 90%+ in 5 math tests',
        'icon' => '🧮',
        'category' => 'academic',
        'xp' => 200,
        'rarity' => 'rare'
    ],
    'science_star' => [
        'id' => 'science_star',
        'name' => 'Science Star',
        'description' => 'Scored 90%+ in 5 science tests',
        'icon' => '🔬',
        'category' => 'academic',
        'xp' => 200,
        'rarity' => 'rare'
    ],
    'improvement_hero' => [
        'id' => 'improvement_hero',
        'name' => 'Improvement Hero',
        'description' => 'Improved grade by 20% in any subject',
        'icon' => '📈',
        'category' => 'academic',
        'xp' => 150,
        'rarity' => 'uncommon'
    ],
    
    // Homework badges
    'homework_streak_5' => [
        'id' => 'homework_streak_5',
        'name' => 'Homework Streak',
        'description' => 'Submitted 5 homework assignments on time',
        'icon' => '📝',
        'category' => 'homework',
        'xp' => 50,
        'rarity' => 'common'
    ],
    'homework_streak_20' => [
        'id' => 'homework_streak_20',
        'name' => 'Homework Master',
        'description' => 'Submitted 20 homework assignments on time',
        'icon' => '✍️',
        'category' => 'homework',
        'xp' => 200,
        'rarity' => 'rare'
    ],
    'homework_perfect' => [
        'id' => 'homework_perfect',
        'name' => 'Perfect Homework',
        'description' => 'Got 100% on a homework assignment',
        'icon' => '💯',
        'category' => 'homework',
        'xp' => 75,
        'rarity' => 'uncommon'
    ],
    
    // Participation badges
    'class_participation' => [
        'id' => 'class_participation',
        'name' => 'Active Participant',
        'description' => 'Actively participated in 10 class discussions',
        'icon' => '🙋',
        'category' => 'participation',
        'xp' => 100,
        'rarity' => 'uncommon'
    ],
    'helper' => [
        'id' => 'helper',
        'name' => 'Helpful Friend',
        'description' => 'Helped classmates with their studies',
        'icon' => '🤝',
        'category' => 'participation',
        'xp' => 75,
        'rarity' => 'common'
    ],
    'club_member' => [
        'id' => 'club_member',
        'name' => 'Club Member',
        'description' => 'Joined a school club or activity',
        'icon' => '🎭',
        'category' => 'participation',
        'xp' => 50,
        'rarity' => 'common'
    ],
    
    // Special badges
    'first_login' => [
        'id' => 'first_login',
        'name' => 'Welcome!',
        'description' => 'Logged into the system for the first time',
        'icon' => '👋',
        'category' => 'special',
        'xp' => 10,
        'rarity' => 'common'
    ],
    'profile_complete' => [
        'id' => 'profile_complete',
        'name' => 'Profile Pro',
        'description' => 'Completed your profile with photo',
        'icon' => '📸',
        'category' => 'special',
        'xp' => 25,
        'rarity' => 'common'
    ],
    'bookworm' => [
        'id' => 'bookworm',
        'name' => 'Bookworm',
        'description' => 'Read 10 library books',
        'icon' => '📖',
        'category' => 'special',
        'xp' => 150,
        'rarity' => 'uncommon'
    ]
];

// Level thresholds
$LEVELS = [
    1 => 0,
    2 => 100,
    3 => 250,
    4 => 500,
    5 => 1000,
    6 => 1750,
    7 => 2750,
    8 => 4000,
    9 => 5500,
    10 => 7500,
    11 => 10000,
    12 => 13000,
    13 => 16500,
    14 => 20500,
    15 => 25000
];

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create gamification tables
    createGamificationTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'profile';
    $userId = $_GET['user_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    $classId = $_GET['class_id'] ?? null;

    switch ($action) {
        case 'profile':
            // Get gamification profile for a student
            echo json_encode(getGamificationProfile($pdo, $studentId, $BADGES, $LEVELS));
            break;
            
        case 'badges':
            // Get all available badges
            echo json_encode(['success' => true, 'badges' => array_values($BADGES)]);
            break;
            
        case 'earned_badges':
            // Get badges earned by a student
            echo json_encode(getEarnedBadges($pdo, $studentId, $BADGES));
            break;
            
        case 'award_badge':
            // Award a badge to a student (POST)
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(awardBadge($pdo, $data['student_id'], $data['badge_id'], $BADGES));
            break;
            
        case 'add_xp':
            // Add XP to a student (POST)
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(addXP($pdo, $data['student_id'], $data['xp'], $data['reason'] ?? 'Activity', $LEVELS));
            break;
            
        case 'leaderboard':
            // Get leaderboard
            $type = $_GET['type'] ?? 'xp'; // xp, badges, attendance
            $limit = min((int)($_GET['limit'] ?? 10), 50);
            echo json_encode(getLeaderboard($pdo, $classId, $type, $limit, $LEVELS));
            break;
            
        case 'recent_achievements':
            // Get recent achievements across all students
            $limit = min((int)($_GET['limit'] ?? 10), 50);
            echo json_encode(getRecentAchievements($pdo, $classId, $limit, $BADGES));
            break;
            
        case 'check_badges':
            // Check and award any earned badges for a student
            echo json_encode(checkAndAwardBadges($pdo, $studentId, $BADGES));
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function createGamificationTables($pdo) {
    // Student XP and level tracking
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_xp (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL UNIQUE,
            total_xp INT DEFAULT 0,
            level INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id),
            INDEX idx_total_xp (total_xp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // XP history
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS xp_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            xp_amount INT NOT NULL,
            reason VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Earned badges
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_badges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            badge_id VARCHAR(50) NOT NULL,
            earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_badge (student_id, badge_id),
            INDEX idx_student_id (student_id),
            INDEX idx_earned_at (earned_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function getGamificationProfile($pdo, $studentId, $badges, $levels) {
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    $profile = [
        'student_id' => $studentId,
        'total_xp' => 0,
        'level' => 1,
        'level_progress' => 0,
        'xp_to_next_level' => 100,
        'badges_earned' => 0,
        'recent_badges' => [],
        'rank' => null
    ];
    
    try {
        // Get or create XP record
        $stmt = $pdo->prepare("SELECT * FROM student_xp WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $xpRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$xpRecord) {
            // Create initial record
            $stmt = $pdo->prepare("INSERT INTO student_xp (student_id, total_xp, level) VALUES (?, 0, 1)");
            $stmt->execute([$studentId]);
            $xpRecord = ['total_xp' => 0, 'level' => 1];
        }
        
        $profile['total_xp'] = (int)$xpRecord['total_xp'];
        $profile['level'] = (int)$xpRecord['level'];
        
        // Calculate level progress
        $currentLevelXP = $levels[$profile['level']] ?? 0;
        $nextLevelXP = $levels[$profile['level'] + 1] ?? ($currentLevelXP + 1000);
        $xpInCurrentLevel = $profile['total_xp'] - $currentLevelXP;
        $xpNeededForLevel = $nextLevelXP - $currentLevelXP;
        
        $profile['level_progress'] = round(($xpInCurrentLevel / $xpNeededForLevel) * 100, 1);
        $profile['xp_to_next_level'] = $nextLevelXP - $profile['total_xp'];
        
        // Get earned badges count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_badges WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $profile['badges_earned'] = (int)$stmt->fetchColumn();
        
        // Get recent badges
        $stmt = $pdo->prepare("
            SELECT badge_id, earned_at 
            FROM student_badges 
            WHERE student_id = ? 
            ORDER BY earned_at DESC 
            LIMIT 5
        ");
        $stmt->execute([$studentId]);
        $recentBadges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($recentBadges as $badge) {
            if (isset($badges[$badge['badge_id']])) {
                $profile['recent_badges'][] = array_merge(
                    $badges[$badge['badge_id']],
                    ['earned_at' => $badge['earned_at']]
                );
            }
        }
        
        // Get rank
        $stmt = $pdo->prepare("
            SELECT COUNT(*) + 1 as rank
            FROM student_xp
            WHERE total_xp > (SELECT total_xp FROM student_xp WHERE student_id = ?)
        ");
        $stmt->execute([$studentId]);
        $profile['rank'] = (int)$stmt->fetchColumn();
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
    
    return ['success' => true, 'profile' => $profile];
}

function getEarnedBadges($pdo, $studentId, $badges) {
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    $earnedBadges = [];
    
    try {
        $stmt = $pdo->prepare("
            SELECT badge_id, earned_at 
            FROM student_badges 
            WHERE student_id = ? 
            ORDER BY earned_at DESC
        ");
        $stmt->execute([$studentId]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($records as $record) {
            if (isset($badges[$record['badge_id']])) {
                $earnedBadges[] = array_merge(
                    $badges[$record['badge_id']],
                    ['earned_at' => $record['earned_at']]
                );
            }
        }
    } catch (Exception $e) {}
    
    return ['success' => true, 'badges' => $earnedBadges];
}

function awardBadge($pdo, $studentId, $badgeId, $badges) {
    if (!$studentId || !$badgeId) {
        return ['success' => false, 'error' => 'Student ID and Badge ID required'];
    }
    
    if (!isset($badges[$badgeId])) {
        return ['success' => false, 'error' => 'Invalid badge ID'];
    }
    
    try {
        // Check if already earned
        $stmt = $pdo->prepare("SELECT id FROM student_badges WHERE student_id = ? AND badge_id = ?");
        $stmt->execute([$studentId, $badgeId]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'Badge already earned'];
        }
        
        // Award badge
        $stmt = $pdo->prepare("INSERT INTO student_badges (student_id, badge_id) VALUES (?, ?)");
        $stmt->execute([$studentId, $badgeId]);
        
        // Award XP for badge
        $badge = $badges[$badgeId];
        addXPInternal($pdo, $studentId, $badge['xp'], "Earned badge: " . $badge['name']);
        
        return [
            'success' => true,
            'message' => 'Badge awarded!',
            'badge' => $badge,
            'xp_earned' => $badge['xp']
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function addXP($pdo, $studentId, $xp, $reason, $levels) {
    if (!$studentId || !$xp) {
        return ['success' => false, 'error' => 'Student ID and XP amount required'];
    }
    
    return addXPInternal($pdo, $studentId, $xp, $reason, $levels);
}

function addXPInternal($pdo, $studentId, $xp, $reason = 'Activity', $levels = null) {
    global $LEVELS;
    if (!$levels) $levels = $LEVELS;
    
    try {
        // Get or create XP record
        $stmt = $pdo->prepare("SELECT * FROM student_xp WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$record) {
            $stmt = $pdo->prepare("INSERT INTO student_xp (student_id, total_xp, level) VALUES (?, ?, 1)");
            $stmt->execute([$studentId, $xp]);
            $newXP = $xp;
            $oldLevel = 1;
        } else {
            $newXP = $record['total_xp'] + $xp;
            $oldLevel = $record['level'];
            $stmt = $pdo->prepare("UPDATE student_xp SET total_xp = ? WHERE student_id = ?");
            $stmt->execute([$newXP, $studentId]);
        }
        
        // Log XP history
        $stmt = $pdo->prepare("INSERT INTO xp_history (student_id, xp_amount, reason) VALUES (?, ?, ?)");
        $stmt->execute([$studentId, $xp, $reason]);
        
        // Check for level up
        $newLevel = 1;
        foreach ($levels as $level => $threshold) {
            if ($newXP >= $threshold) {
                $newLevel = $level;
            }
        }
        
        $leveledUp = $newLevel > $oldLevel;
        
        if ($leveledUp) {
            $stmt = $pdo->prepare("UPDATE student_xp SET level = ? WHERE student_id = ?");
            $stmt->execute([$newLevel, $studentId]);
        }
        
        return [
            'success' => true,
            'xp_added' => $xp,
            'total_xp' => $newXP,
            'level' => $newLevel,
            'leveled_up' => $leveledUp
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function getLeaderboard($pdo, $classId, $type, $limit, $levels) {
    $leaderboard = [];
    
    try {
        $sql = "
            SELECT 
                sx.student_id,
                s.first_name,
                s.last_name,
                s.photo,
                c.class_name,
                sx.total_xp,
                sx.level,
                (SELECT COUNT(*) FROM student_badges sb WHERE sb.student_id = sx.student_id) as badge_count
            FROM student_xp sx
            JOIN students s ON sx.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.status = 'active'
        ";
        
        if ($classId) {
            $sql .= " AND s.class_id = ?";
        }
        
        switch ($type) {
            case 'badges':
                $sql .= " ORDER BY badge_count DESC, sx.total_xp DESC";
                break;
            default:
                $sql .= " ORDER BY sx.total_xp DESC";
        }
        
        $sql .= " LIMIT " . (int)$limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($classId ? [$classId] : []);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $rank = 1;
        foreach ($results as $row) {
            $leaderboard[] = [
                'rank' => $rank++,
                'student_id' => $row['student_id'],
                'name' => $row['first_name'] . ' ' . $row['last_name'],
                'photo' => $row['photo'],
                'class_name' => $row['class_name'],
                'total_xp' => (int)$row['total_xp'],
                'level' => (int)$row['level'],
                'badge_count' => (int)$row['badge_count']
            ];
        }
        
    } catch (Exception $e) {}
    
    return ['success' => true, 'leaderboard' => $leaderboard];
}

function getRecentAchievements($pdo, $classId, $limit, $badges) {
    $achievements = [];
    
    try {
        $sql = "
            SELECT 
                sb.badge_id,
                sb.earned_at,
                s.id as student_id,
                s.first_name,
                s.last_name,
                s.photo,
                c.class_name
            FROM student_badges sb
            JOIN students s ON sb.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.status = 'active'
        ";
        
        if ($classId) {
            $sql .= " AND s.class_id = ?";
        }
        
        $sql .= " ORDER BY sb.earned_at DESC LIMIT " . (int)$limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($classId ? [$classId] : []);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as $row) {
            if (isset($badges[$row['badge_id']])) {
                $achievements[] = [
                    'student_id' => $row['student_id'],
                    'student_name' => $row['first_name'] . ' ' . $row['last_name'],
                    'student_photo' => $row['photo'],
                    'class_name' => $row['class_name'],
                    'badge' => $badges[$row['badge_id']],
                    'earned_at' => $row['earned_at']
                ];
            }
        }
        
    } catch (Exception $e) {}
    
    return ['success' => true, 'achievements' => $achievements];
}

function checkAndAwardBadges($pdo, $studentId, $badges) {
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    $newBadges = [];
    
    try {
        // Check attendance badges
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as days
            FROM attendance
            WHERE student_id = ? AND status = 'present'
            AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ");
        $stmt->execute([$studentId]);
        $weekAttendance = $stmt->fetchColumn();
        
        if ($weekAttendance >= 5) {
            $result = awardBadge($pdo, $studentId, 'perfect_attendance_week', $badges);
            if ($result['success']) $newBadges[] = $result['badge'];
        }
        
        // Check homework badges
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM homework_submissions
            WHERE student_id = ? AND status IN ('submitted', 'graded')
        ");
        $stmt->execute([$studentId]);
        $homeworkCount = $stmt->fetchColumn();
        
        if ($homeworkCount >= 5) {
            $result = awardBadge($pdo, $studentId, 'homework_streak_5', $badges);
            if ($result['success']) $newBadges[] = $result['badge'];
        }
        
        if ($homeworkCount >= 20) {
            $result = awardBadge($pdo, $studentId, 'homework_streak_20', $badges);
            if ($result['success']) $newBadges[] = $result['badge'];
        }
        
        // Check for first A grade
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM grades WHERE student_id = ? AND score >= 80
        ");
        $stmt->execute([$studentId]);
        if ($stmt->fetchColumn() > 0) {
            $result = awardBadge($pdo, $studentId, 'first_a', $badges);
            if ($result['success']) $newBadges[] = $result['badge'];
        }
        
    } catch (Exception $e) {}
    
    return [
        'success' => true,
        'new_badges' => $newBadges,
        'badges_awarded' => count($newBadges)
    ];
}
