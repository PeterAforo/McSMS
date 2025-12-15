<?php
class SubjectsController extends Controller {
    
    public function __construct() {
        $this->requireRole(['admin']);
    }
    
    public function index() {
        $subjectModel = new SubjectModel();
        $subjects = $subjectModel->findAll();
        
        $this->render('subjects/index', [
            'pageTitle' => 'Subjects - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'subjects' => $subjects
        ]);
    }
    
    private function getAdminSidebar() {
        $currentController = $_GET['c'] ?? 'admin';
        
        return [
            ['label' => 'Dashboard', 'url' => APP_URL . '/index.php?c=admin&a=dashboard', 'icon' => 'fas fa-tachometer-alt', 'active' => ''],
            ['label' => 'Classes', 'url' => APP_URL . '/index.php?c=classes', 'icon' => 'fas fa-school', 'active' => ''],
            ['label' => 'Sections', 'url' => APP_URL . '/index.php?c=sections', 'icon' => 'fas fa-layer-group', 'active' => ''],
            ['label' => 'Subjects', 'url' => APP_URL . '/index.php?c=subjects', 'icon' => 'fas fa-book', 'active' => $currentController === 'subjects' ? 'active' : ''],
            ['label' => 'Academic Terms', 'url' => APP_URL . '/index.php?c=terms', 'icon' => 'fas fa-calendar-alt', 'active' => ''],
        ];
    }
}
