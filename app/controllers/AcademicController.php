<?php
/**
 * Academic Controller
 * Handles academic management
 */

class AcademicController extends Controller {
    
    public function __construct() {
        $this->requireRole(['admin']);
    }
    
    /**
     * Manage Classes
     */
    public function classes() {
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('academic/classes', [
            'pageTitle' => 'Manage Classes - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'classes' => $classes
        ]);
    }
    
    /**
     * Manage Subjects
     */
    public function subjects() {
        $subjectModel = new Subject();
        $subjects = $subjectModel->findAll();
        
        $this->render('academic/subjects', [
            'pageTitle' => 'Manage Subjects - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'subjects' => $subjects
        ]);
    }
    
    /**
     * Create Class Form
     */
    public function createClass() {
        $this->render('academic/class_form', [
            'pageTitle' => 'Create Class - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'class' => null
        ]);
    }
    
    /**
     * Edit Class Form
     */
    public function editClass() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Class ID required.', 'error');
            $this->redirect('academic', 'classes');
        }
        
        $classModel = new ClassModel();
        $class = $classModel->findById($id);
        
        if (!$class) {
            Session::setFlash('error', 'Class not found.', 'error');
            $this->redirect('academic', 'classes');
        }
        
        $this->render('academic/class_form', [
            'pageTitle' => 'Edit Class - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'class' => $class
        ]);
    }
    
    /**
     * Store Class
     */
    public function storeClass() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('academic', 'classes');
        }
        
        $classModel = new ClassModel();
        $classId = $_POST['class_id'] ?? null;
        
        $data = [
            'class_name' => trim($_POST['class_name'] ?? ''),
            'level' => $_POST['level'] ?? ''
        ];
        
        if (empty($data['class_name']) || empty($data['level'])) {
            Session::setFlash('error', 'All fields are required.', 'error');
            $this->redirect('academic', $classId ? 'editClass' : 'createClass');
        }
        
        try {
            if ($classId) {
                $classModel->update($classId, $data);
                Session::setFlash('success', 'Class updated successfully!', 'success');
            } else {
                $classModel->insert($data);
                Session::setFlash('success', 'Class created successfully!', 'success');
            }
            
            $this->redirect('academic', 'classes');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save class.', 'error');
            $this->redirect('academic', $classId ? 'editClass' : 'createClass');
        }
    }
    
    /**
     * Delete Class
     */
    public function deleteClass() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Class ID required.', 'error');
            $this->redirect('academic', 'classes');
        }
        
        $classModel = new ClassModel();
        
        try {
            $classModel->delete($id);
            Session::setFlash('success', 'Class deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete class. It may have students assigned.', 'error');
        }
        
        $this->redirect('academic', 'classes');
    }
    
    /**
     * Create Subject Form
     */
    public function createSubject() {
        $this->render('academic/subject_form', [
            'pageTitle' => 'Create Subject - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'subject' => null
        ]);
    }
    
    /**
     * Edit Subject Form
     */
    public function editSubject() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Subject ID required.', 'error');
            $this->redirect('academic', 'subjects');
        }
        
        $subjectModel = new Subject();
        $subject = $subjectModel->findById($id);
        
        if (!$subject) {
            Session::setFlash('error', 'Subject not found.', 'error');
            $this->redirect('academic', 'subjects');
        }
        
        $this->render('academic/subject_form', [
            'pageTitle' => 'Edit Subject - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAcademicSidebar(),
            'subject' => $subject
        ]);
    }
    
    /**
     * Store Subject
     */
    public function storeSubject() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('academic', 'subjects');
        }
        
        $subjectModel = new Subject();
        $subjectId = $_POST['subject_id'] ?? null;
        
        $data = [
            'subject_name' => trim($_POST['subject_name'] ?? ''),
            'level' => $_POST['level'] ?? ''
        ];
        
        if (empty($data['subject_name']) || empty($data['level'])) {
            Session::setFlash('error', 'All fields are required.', 'error');
            $this->redirect('academic', $subjectId ? 'editSubject' : 'createSubject');
        }
        
        try {
            if ($subjectId) {
                $subjectModel->update($subjectId, $data);
                Session::setFlash('success', 'Subject updated successfully!', 'success');
            } else {
                $subjectModel->insert($data);
                Session::setFlash('success', 'Subject created successfully!', 'success');
            }
            
            $this->redirect('academic', 'subjects');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save subject.', 'error');
            $this->redirect('academic', $subjectId ? 'editSubject' : 'createSubject');
        }
    }
    
    /**
     * Delete Subject
     */
    public function deleteSubject() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Subject ID required.', 'error');
            $this->redirect('academic', 'subjects');
        }
        
        $subjectModel = new Subject();
        
        try {
            $subjectModel->delete($id);
            Session::setFlash('success', 'Subject deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete subject.', 'error');
        }
        
        $this->redirect('academic', 'subjects');
    }
    
    /**
     * Academic sidebar
     */
    private function getAcademicSidebar() {
        $currentAction = $_GET['a'] ?? 'classes';
        
        return [
            ['label' => 'Classes', 'url' => APP_URL . '/index.php?c=academic&a=classes', 'icon' => 'fas fa-school', 'active' => $currentAction === 'classes' ? 'active' : ''],
            ['label' => 'Subjects', 'url' => APP_URL . '/index.php?c=academic&a=subjects', 'icon' => 'fas fa-book', 'active' => $currentAction === 'subjects' ? 'active' : ''],
        ];
    }
}
