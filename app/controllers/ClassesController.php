<?php
class ClassesController extends Controller {
    
    public function __construct() {
        $this->requireRole(['admin']);
    }
    
    public function index() {
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('classes/index', [
            'pageTitle' => 'Classes - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'classes' => $classes
        ]);
    }
    
    private function getAdminSidebar() {
        $currentController = $_GET['c'] ?? 'admin';
        
        return [
            ['label' => 'Dashboard', 'url' => APP_URL . '/index.php?c=admin&a=dashboard', 'icon' => 'fas fa-tachometer-alt', 'active' => ''],
            ['label' => 'Classes', 'url' => APP_URL . '/index.php?c=classes', 'icon' => 'fas fa-school', 'active' => $currentController === 'classes' ? 'active' : ''],
            ['label' => 'Sections', 'url' => APP_URL . '/index.php?c=sections', 'icon' => 'fas fa-layer-group', 'active' => ''],
            ['label' => 'Subjects', 'url' => APP_URL . '/index.php?c=subjects', 'icon' => 'fas fa-book', 'active' => ''],
            ['label' => 'Academic Terms', 'url' => APP_URL . '/index.php?c=terms', 'icon' => 'fas fa-calendar-alt', 'active' => ''],
        ];
    }
}
