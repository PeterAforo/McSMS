<?php
/**
 * Admissions Controller
 * Handles admission application review and approval
 */

class AdmissionsController extends Controller {
    private $admissionModel;
    private $studentModel;
    private $classModel;
    
    public function __construct() {
        $this->requireRole(['admin', 'admissions']);
        $this->admissionModel = new Admission();
        $this->studentModel = new Student();
        $this->classModel = new ClassModel();
    }
    
    /**
     * Admissions Dashboard
     */
    public function dashboard() {
        $stats = [
            'pending' => $this->getCountByStatus('pending'),
            'approved' => $this->getCountByStatus('approved'),
            'rejected' => $this->getCountByStatus('rejected'),
            'total' => $this->getTotalApplications()
        ];
        
        $recentApplications = $this->admissionModel->getAllPending();
        
        $this->render('admissions/dashboard', [
            'pageTitle' => 'Admissions Dashboard - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'stats' => $stats,
            'applications' => array_slice($recentApplications, 0, 10)
        ]);
    }
    
    /**
     * List pending applications
     */
    public function pending() {
        $applications = $this->admissionModel->getAllPending();
        
        $this->render('admissions/list_pending', [
            'pageTitle' => 'Pending Applications - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'applications' => $applications
        ]);
    }
    
    /**
     * View application details
     */
    public function view() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Application ID is required.', 'error');
            $this->redirect('admissions', 'pending');
        }
        
        $application = $this->admissionModel->findById($id);
        
        if (!$application) {
            Session::setFlash('error', 'Application not found.', 'error');
            $this->redirect('admissions', 'pending');
        }
        
        // Get child details
        $childModel = new ChildModel();
        $child = $childModel->getWithParent($application['child_id']);
        
        // Get class details
        $class = $this->classModel->getWithSections($application['preferred_class_id']);
        
        $this->render('admissions/view_application', [
            'pageTitle' => 'Application Details - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'application' => $application,
            'child' => $child,
            'class' => $class
        ]);
    }
    
    /**
     * Approve application
     */
    public function approve() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Application ID is required.', 'error');
            $this->redirect('admissions', 'pending');
        }
        
        $application = $this->admissionModel->findById($id);
        $childModel = new ChildModel();
        $child = $childModel->getWithParent($application['child_id']);
        $class = $this->classModel->getWithSections($application['preferred_class_id']);
        
        $this->render('admissions/approve_form', [
            'pageTitle' => 'Approve Application - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'application' => $application,
            'child' => $child,
            'class' => $class
        ]);
    }
    
    /**
     * Process approval
     */
    public function doApprove() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('admissions', 'pending');
        }
        
        $applicationId = $_POST['application_id'] ?? null;
        $classId = $_POST['class_id'] ?? null;
        $sectionId = $_POST['section_id'] ?? null;
        $remarks = trim($_POST['remarks'] ?? '');
        
        if (!$applicationId || !$classId || !$sectionId) {
            Session::setFlash('error', 'All fields are required.', 'error');
            $this->redirect('admissions', 'approve', ['id' => $applicationId]);
        }
        
        try {
            $application = $this->admissionModel->findById($applicationId);
            
            // Generate student ID
            $studentId = $this->generateStudentId();
            
            // Create student record
            $this->studentModel->insert([
                'child_id' => $application['child_id'],
                'student_id' => $studentId,
                'class_id' => $classId,
                'section_id' => $sectionId,
                'enrollment_date' => date('Y-m-d'),
                'status' => 'active'
            ]);
            
            // Update admission status
            $this->admissionModel->updateStatus(
                $applicationId,
                'approved',
                $remarks,
                Auth::id()
            );
            
            Session::setFlash('success', 'Application approved successfully! Student ID: ' . $studentId, 'success');
            $this->redirect('admissions', 'pending');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to approve application: ' . $e->getMessage(), 'error');
            $this->redirect('admissions', 'approve', ['id' => $applicationId]);
        }
    }
    
    /**
     * Reject application
     */
    public function reject() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Application ID is required.', 'error');
            $this->redirect('admissions', 'pending');
        }
        
        $application = $this->admissionModel->findById($id);
        $childModel = new ChildModel();
        $child = $childModel->getWithParent($application['child_id']);
        
        $this->render('admissions/reject_form', [
            'pageTitle' => 'Reject Application - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'application' => $application,
            'child' => $child
        ]);
    }
    
    /**
     * Process rejection
     */
    public function doReject() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('admissions', 'pending');
        }
        
        $applicationId = $_POST['application_id'] ?? null;
        $remarks = trim($_POST['remarks'] ?? '');
        
        if (!$applicationId || empty($remarks)) {
            Session::setFlash('error', 'Remarks are required for rejection.', 'error');
            $this->redirect('admissions', 'reject', ['id' => $applicationId]);
        }
        
        try {
            $this->admissionModel->updateStatus(
                $applicationId,
                'rejected',
                $remarks,
                Auth::id()
            );
            
            Session::setFlash('success', 'Application rejected.', 'success');
            $this->redirect('admissions', 'pending');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to reject application.', 'error');
            $this->redirect('admissions', 'reject', ['id' => $applicationId]);
        }
    }
    
    /**
     * View history
     */
    public function history() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("
            SELECT a.*, c.full_name as child_name, c.gender, c.date_of_birth,
            cl.class_name, u.name as parent_name, u.email as parent_email,
            proc.name as processed_by_name
            FROM admissions a
            JOIN children c ON a.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN classes cl ON a.preferred_class_id = cl.id
            LEFT JOIN users proc ON a.processed_by = proc.id
            WHERE a.status IN ('approved', 'rejected')
            ORDER BY a.created_at DESC
        ");
        $applications = $stmt->fetchAll();
        
        $this->render('admissions/history', [
            'pageTitle' => 'Application History - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdmissionsSidebar(),
            'applications' => $applications
        ]);
    }
    
    /**
     * Generate unique student ID
     */
    private function generateStudentId() {
        $year = date('Y');
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT COUNT(*) FROM students");
        $count = $stmt->fetchColumn() + 1;
        return 'STU' . $year . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * Get count by status
     */
    private function getCountByStatus($status) {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) FROM admissions WHERE status = ?");
        $stmt->execute([$status]);
        return $stmt->fetchColumn();
    }
    
    /**
     * Get total applications
     */
    private function getTotalApplications() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT COUNT(*) FROM admissions");
        return $stmt->fetchColumn();
    }
    
    /**
     * Get admissions sidebar
     */
    private function getAdmissionsSidebar() {
        $currentAction = $_GET['a'] ?? 'dashboard';
        
        return [
            [
                'label' => 'Dashboard',
                'url' => APP_URL . '/index.php?c=admissions&a=dashboard',
                'icon' => 'fas fa-tachometer-alt',
                'active' => $currentAction === 'dashboard' ? 'active' : ''
            ],
            [
                'label' => 'Pending Applications',
                'url' => APP_URL . '/index.php?c=admissions&a=pending',
                'icon' => 'fas fa-clock',
                'active' => $currentAction === 'pending' ? 'active' : ''
            ],
            [
                'label' => 'History',
                'url' => APP_URL . '/index.php?c=admissions&a=history',
                'icon' => 'fas fa-history',
                'active' => $currentAction === 'history' ? 'active' : ''
            ],
        ];
    }
}
