<?php
/**
 * Dynamic PWA Manifest Generator
 * Generates manifest.json with school name and logo from settings
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, must-revalidate');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Get school settings from system_config table
    $settings = [
        'school_name' => 'McSMS',
        'school_logo' => null,
        'school_tagline' => 'School Management System',
        'primary_color' => '#1e40af'
    ];

    // Try system_config table first
    try {
        $stmt = $pdo->query("SELECT config_key, config_value FROM system_config WHERE config_key IN ('school_name', 'school_logo', 'school_motto', 'primary_color')");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['config_key'] === 'school_motto') {
                $settings['school_tagline'] = $row['config_value'];
            } elseif (!empty($row['config_value'])) {
                $settings[$row['config_key']] = $row['config_value'];
            }
        }
    } catch (Exception $e) {
        // Table might not exist
    }

    // Also try system_settings table as fallback
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('school_name', 'school_logo', 'school_tagline', 'primary_color')");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!empty($row['setting_value']) && (empty($settings[$row['setting_key']]) || $settings[$row['setting_key']] === 'McSMS')) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
    } catch (Exception $e) {
        // Table might not exist
    }

    // Build icon URLs
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    
    $icons = [];
    
    if ($settings['school_logo']) {
        // Use school logo for all icon sizes
        $logoUrl = $settings['school_logo'];
        if (!str_starts_with($logoUrl, 'http')) {
            $logoUrl = $baseUrl . $logoUrl;
        }
        
        $icons = [
            [
                'src' => $logoUrl,
                'sizes' => '192x192',
                'type' => 'image/png',
                'purpose' => 'any'
            ],
            [
                'src' => $logoUrl,
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'any'
            ],
            [
                'src' => $logoUrl,
                'sizes' => 'any',
                'type' => 'image/png',
                'purpose' => 'maskable'
            ]
        ];
    } else {
        // Fallback to default icons
        $icons = [
            [
                'src' => '/icons/icon-192x192.svg',
                'sizes' => '192x192',
                'type' => 'image/svg+xml',
                'purpose' => 'any'
            ],
            [
                'src' => '/icons/icon-512x512.svg',
                'sizes' => '512x512',
                'type' => 'image/svg+xml',
                'purpose' => 'any'
            ],
            [
                'src' => '/icons/icon-192x192.svg',
                'sizes' => 'any',
                'type' => 'image/svg+xml',
                'purpose' => 'maskable'
            ]
        ];
    }

    // Generate short name (abbreviation)
    $shortName = $settings['school_name'];
    $words = explode(' ', $settings['school_name']);
    if (count($words) > 1) {
        $shortName = '';
        foreach (array_slice($words, 0, 4) as $word) {
            $shortName .= strtoupper(substr($word, 0, 1));
        }
    } elseif (strlen($settings['school_name']) > 10) {
        $shortName = substr($settings['school_name'], 0, 10);
    }

    $manifest = [
        'name' => $settings['school_name'] . ' - ' . $settings['school_tagline'],
        'short_name' => $shortName,
        'description' => $settings['school_tagline'] . ' - Complete School Management System',
        'start_url' => '/',
        'display' => 'standalone',
        'background_color' => $settings['primary_color'] ?: '#1e40af',
        'theme_color' => $settings['primary_color'] ?: '#1e40af',
        'orientation' => 'any',
        'scope' => '/',
        'icons' => $icons,
        'categories' => ['education', 'productivity'],
        'shortcuts' => [
            ['name' => 'Dashboard', 'url' => '/admin/dashboard'],
            ['name' => 'Students', 'url' => '/admin/students'],
            ['name' => 'Messages', 'url' => '/teacher/messages']
        ],
        'related_applications' => [],
        'prefer_related_applications' => false
    ];

    echo json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Return default manifest on error
    echo json_encode([
        'name' => 'McSMS - School Management System',
        'short_name' => 'McSMS',
        'description' => 'Complete School Management System',
        'start_url' => '/',
        'display' => 'standalone',
        'background_color' => '#1e40af',
        'theme_color' => '#1e40af',
        'icons' => [
            ['src' => '/icons/icon-192x192.svg', 'sizes' => '192x192', 'type' => 'image/svg+xml', 'purpose' => 'any']
        ]
    ], JSON_PRETTY_PRINT);
}
