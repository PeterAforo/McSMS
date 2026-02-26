<?php
/**
 * Email Templates API
 * Manages email template CRUD operations
 */

// Load security bootstrap
require_once __DIR__ . '/../middleware/security_bootstrap.php';

// Initialize security
SecurityBootstrap::init();

require_once __DIR__ . '/../src/Email/EmailTemplateService.php';

use McSMS\Email\EmailTemplateService;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// Verify admin access
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (strpos($authHeader, 'Bearer ') !== 0) {
    SecurityBootstrap::errorResponse('Unauthorized', 401);
}

try {
    $templateService = new EmailTemplateService();
    
    switch ($method) {
        case 'GET':
            handleGet($templateService, $action);
            break;
            
        case 'POST':
            handlePost($templateService, $action);
            break;
            
        case 'PUT':
            handlePut($templateService);
            break;
            
        case 'DELETE':
            handleDelete($templateService);
            break;
            
        default:
            SecurityBootstrap::errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    SecurityBootstrap::errorResponse($e->getMessage(), 500);
}

/**
 * Handle GET requests
 */
function handleGet($templateService, $action) {
    switch ($action) {
        case 'list':
            $category = $_GET['category'] ?? null;
            $activeOnly = ($_GET['active_only'] ?? 'true') === 'true';
            
            $templates = $templateService->getAllTemplates($category, $activeOnly);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $templates,
            ]);
            break;
            
        case 'get':
            $slug = $_GET['slug'] ?? '';
            if (empty($slug)) {
                SecurityBootstrap::errorResponse('Template slug is required');
            }
            
            $template = $templateService->getTemplate($slug);
            if (!$template) {
                SecurityBootstrap::errorResponse('Template not found', 404);
            }
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $template,
            ]);
            break;
            
        case 'preview':
            $slug = $_GET['slug'] ?? '';
            if (empty($slug)) {
                SecurityBootstrap::errorResponse('Template slug is required');
            }
            
            try {
                $preview = $templateService->preview($slug);
                SecurityBootstrap::jsonResponse([
                    'success' => true,
                    'data' => $preview,
                ]);
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse($e->getMessage(), 404);
            }
            break;
            
        case 'categories':
            $categories = $templateService->getCategories();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $categories,
            ]);
            break;
            
        case 'initialize':
            $count = $templateService->initializeDefaults();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'message' => "Initialized {$count} default templates",
            ]);
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}

/**
 * Handle POST requests
 */
function handlePost($templateService, $action) {
    $input = SecurityBootstrap::getInput() ?? [];
    
    switch ($action) {
        case 'create':
            $required = ['slug', 'name', 'category', 'subject', 'body_html'];
            $missing = InputValidator::validateRequired($input, $required);
            
            if (!empty($missing)) {
                SecurityBootstrap::errorResponse('Missing required fields: ' . implode(', ', $missing));
            }
            
            // Validate slug format
            if (!preg_match('/^[a-z0-9_]+$/', $input['slug'])) {
                SecurityBootstrap::errorResponse('Slug must contain only lowercase letters, numbers, and underscores');
            }
            
            // Check if slug exists
            if ($templateService->templateExists($input['slug'])) {
                SecurityBootstrap::errorResponse('Template with this slug already exists');
            }
            
            $id = $templateService->createTemplate($input['slug'], $input);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => ['id' => $id],
            ]);
            break;
            
        case 'render':
            $slug = $input['slug'] ?? '';
            $variables = $input['variables'] ?? [];
            
            if (empty($slug)) {
                SecurityBootstrap::errorResponse('Template slug is required');
            }
            
            try {
                $rendered = $templateService->render($slug, $variables);
                SecurityBootstrap::jsonResponse([
                    'success' => true,
                    'data' => $rendered,
                ]);
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse($e->getMessage(), 404);
            }
            break;
            
        case 'test':
            // Send a test email with the template
            $slug = $input['slug'] ?? '';
            $email = $input['email'] ?? '';
            
            if (empty($slug) || empty($email)) {
                SecurityBootstrap::errorResponse('Template slug and email are required');
            }
            
            if (!InputValidator::validateEmail($email)) {
                SecurityBootstrap::errorResponse('Invalid email address');
            }
            
            try {
                $rendered = $templateService->preview($slug);
                
                // TODO: Integrate with actual email sending service
                // For now, just return the rendered content
                SecurityBootstrap::jsonResponse([
                    'success' => true,
                    'message' => 'Test email would be sent to ' . $email,
                    'data' => $rendered,
                ]);
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse($e->getMessage(), 500);
            }
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}

/**
 * Handle PUT requests
 */
function handlePut($templateService) {
    $slug = $_GET['slug'] ?? '';
    
    if (empty($slug)) {
        SecurityBootstrap::errorResponse('Template slug is required');
    }
    
    $input = SecurityBootstrap::getInput() ?? [];
    
    if (empty($input)) {
        SecurityBootstrap::errorResponse('No data provided');
    }
    
    // Check if template exists
    if (!$templateService->templateExists($slug)) {
        SecurityBootstrap::errorResponse('Template not found', 404);
    }
    
    $result = $templateService->updateTemplate($slug, $input);
    
    if ($result) {
        SecurityBootstrap::jsonResponse([
            'success' => true,
            'message' => 'Template updated successfully',
        ]);
    } else {
        SecurityBootstrap::errorResponse('Failed to update template');
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($templateService) {
    $slug = $_GET['slug'] ?? '';
    
    if (empty($slug)) {
        SecurityBootstrap::errorResponse('Template slug is required');
    }
    
    // Check if template exists
    if (!$templateService->templateExists($slug)) {
        SecurityBootstrap::errorResponse('Template not found', 404);
    }
    
    $result = $templateService->deleteTemplate($slug);
    
    if ($result) {
        SecurityBootstrap::jsonResponse([
            'success' => true,
            'message' => 'Template deleted successfully',
        ]);
    } else {
        SecurityBootstrap::errorResponse('Failed to delete template');
    }
}
