<?php
/**
 * Sections Controller
 * Handles section management
 */

class SectionsController extends Controller {
    private $sectionModel;
    private $classModel;
    
    public function __construct() {
        $this->requireRole('admin');
        $this->sectionModel = new Section();
        $this->classModel = new ClassModel();
    }
    
    /**
     * List all sections
     */
    public function index() {
        $sections = $this->sectionModel->getAllWithClass();
        
        $this->render('sections/index', [
            'pageTitle' => 'Sections Management - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'sections' => $sections
        ]);
    }
    
    /**
     * Create section form
     */
    public function create() {
        $classes = $this->classModel->findAll([], 'level ASC, class_name ASC');
        
        $this->render('sections/form', [
            'pageTitle' => 'Create Section - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'section' => null,
            'classes' => $classes
        ]);
    }
    
    /**
     * Edit section form
     */
    public function edit() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Section ID is required.', 'error');
            $this->redirect('sections', 'index');
        }
        
        $section = $this->sectionModel->getWithClass($id);
        $classes = $this->classModel->findAll([], 'level ASC, class_name ASC');
        
        if (!$section) {
            Session::setFlash('error', 'Section not found.', 'error');
            $this->redirect('sections', 'index');
        }
        
        $this->render('sections/form', [
            'pageTitle' => 'Edit Section - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'section' => $section,
            'classes' => $classes
        ]);
    }
    
    /**
     * Store section (create or update)
     */
    public function store() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('sections', 'index');
        }
        
        $id = $_POST['id'] ?? null;
        $classId = $_POST['class_id'] ?? null;
        $sectionName = trim($_POST['section_name'] ?? '');
        $capacity = intval($_POST['capacity'] ?? 0);
        
        // Validation
        if (empty($classId) || empty($sectionName)) {
            Session::setFlash('error', 'Class and section name are required.', 'error');
            $this->redirect('sections', $id ? 'edit' : 'create', $id ? ['id' => $id] : []);
        }
        
        // Check if section name already exists for this class
        if ($this->sectionModel->sectionExists($classId, $sectionName, $id)) {
            Session::setFlash('error', 'Section name already exists for this class.', 'error');
            $this->redirect('sections', $id ? 'edit' : 'create', $id ? ['id' => $id] : []);
        }
        
        $data = [
            'class_id' => $classId,
            'section_name' => $sectionName,
            'capacity' => $capacity > 0 ? $capacity : null
        ];
        
        try {
            if ($id) {
                // Update
                $this->sectionModel->update($id, $data);
                Session::setFlash('success', 'Section updated successfully!', 'success');
            } else {
                // Create
                $this->sectionModel->insert($data);
                Session::setFlash('success', 'Section created successfully!', 'success');
            }
            
            $this->redirect('sections', 'index');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save section: ' . $e->getMessage(), 'error');
            $this->redirect('sections', $id ? 'edit' : 'create', $id ? ['id' => $id] : []);
        }
    }
    
    /**
     * Delete section
     */
    public function delete() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Section ID is required.', 'error');
            $this->redirect('sections', 'index');
        }
        
        try {
            // Check if section has students
            $studentCount = $this->sectionModel->getStudentCount($id);
            
            if ($studentCount > 0) {
                Session::setFlash('error', 'Cannot delete section with enrolled students.', 'error');
                $this->redirect('sections', 'index');
            }
            
            $this->sectionModel->delete($id);
            Session::setFlash('success', 'Section deleted successfully!', 'success');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete section.', 'error');
        }
        
        $this->redirect('sections', 'index');
    }
    
    /**
     * Get academic sidebar
     */
    private function getAcademicSidebar() {
        $currentController = $_GET['c'] ?? 'dashboard';
        
        return [
            ['label' => 'Dashboard', 'url' => APP_URL . '/index.php?c=dashboard', 'icon' => 'fas fa-home', 'active' => $currentController === 'dashboard' ? 'active' : ''],
            ['label' => 'Classes', 'url' => APP_URL . '/index.php?c=classes', 'icon' => 'fas fa-school', 'active' => $currentController === 'classes' ? 'active' : ''],
            ['label' => 'Sections', 'url' => APP_URL . '/index.php?c=sections', 'icon' => 'fas fa-layer-group', 'active' => $currentController === 'sections' ? 'active' : ''],
            ['label' => 'Subjects', 'url' => APP_URL . '/index.php?c=subjects', 'icon' => 'fas fa-book', 'active' => $currentController === 'subjects' ? 'active' : ''],
            ['label' => 'Academic Terms', 'url' => APP_URL . '/index.php?c=terms', 'icon' => 'fas fa-calendar-alt', 'active' => $currentController === 'terms' ? 'active' : ''],
        ];
    }
}
