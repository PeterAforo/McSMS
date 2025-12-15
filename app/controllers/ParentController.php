<?php
/**
 * Parent Controller
 * Handles parent portal functionality
 */

class ParentController extends Controller {
    private $parentModel;
    private $childModel;
    
    public function __construct() {
        $this->requireRole('parent');
        $this->parentModel = new ParentModel();
        $this->childModel = new ChildModel();
    }
    
    /**
     * TERM ENROLLMENT WORKFLOW
     */
    
    /**
     * Parent Dashboard
     */
    public function dashboard() {
        $userId = Auth::id();
        
        // Get parent info
        $parent = $this->parentModel->getByUserId($userId);
        
        if (!$parent) {
            Session::setFlash('error', 'Parent profile not found.', 'error');
            $this->redirect('auth', 'logout');
        }
        
        // Get children
        $children = $this->parentModel->getChildren($parent['id']);
        
        // Get statistics
        $stats = [
            'total_children' => count($children),
            'pending_applications' => $this->countPendingApplications($parent['id']),
            'outstanding_fees' => $this->calculateOutstandingFees($parent['id']),
            'notifications' => 0 // TODO: Implement notifications
        ];
        
        $this->render('parent/dashboard', [
            'pageTitle' => 'Parent Dashboard - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'parent' => $parent,
            'children' => $children,
            'stats' => $stats
        ]);
    }
    
    /**
     * List children
     */
    public function children() {
        $userId = Auth::id();
        $parent = $this->parentModel->getByUserId($userId);
        $children = $this->parentModel->getChildren($parent['id']);
        
        $this->render('parent/children_list', [
            'pageTitle' => 'My Children - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'children' => $children
        ]);
    }
    
    /**
     * Add child form
     */
    public function addChild() {
        $this->render('parent/child_form', [
            'pageTitle' => 'Add Child - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'child' => null
        ]);
    }
    
    /**
     * Store new child
     */
    public function storeChild() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('parent', 'children');
        }
        
        $userId = Auth::id();
        $parent = $this->parentModel->getByUserId($userId);
        
        $data = [
            'parent_id' => $parent['id'],
            'full_name' => trim($_POST['full_name'] ?? ''),
            'gender' => $_POST['gender'] ?? '',
            'date_of_birth' => $_POST['date_of_birth'] ?? '',
            'previous_school' => trim($_POST['previous_school'] ?? ''),
        ];
        
        // Validate
        if (empty($data['full_name']) || empty($data['gender']) || empty($data['date_of_birth'])) {
            Session::setFlash('error', 'Please fill in all required fields.', 'error');
            Session::setOldInput($_POST);
            $this->redirect('parent', 'addChild');
        }
        
        // Handle photo upload
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $photo = $this->handlePhotoUpload($_FILES['photo']);
            if ($photo) {
                $data['photo'] = $photo;
            }
        }
        
        try {
            $this->childModel->insert($data);
            Session::setFlash('success', 'Child added successfully!', 'success');
            $this->redirect('parent', 'children');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to add child. Please try again.', 'error');
            $this->redirect('parent', 'addChild');
        }
    }
    
    /**
     * View applications
     */
    public function applications() {
        $userId = Auth::id();
        $parent = $this->parentModel->getByUserId($userId);
        
        $admissionModel = new Admission();
        $applications = $admissionModel->getByParent($parent['id']);
        
        $this->render('parent/applications_list', [
            'pageTitle' => 'Admission Applications - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'applications' => $applications
        ]);
    }
    
    /**
     * View Fees & Invoices
     */
    public function fees() {
        $userId = Auth::id();
        $parent = $this->parentModel->getByUserId($userId);
        
        // Get all children with their invoices
        $children = $this->parentModel->getChildren($parent['id']);
        
        $invoices = [];
        if (!empty($children)) {
            $db = DB::getInstance()->getConnection();
            $childIds = array_column($children, 'id');
            $placeholders = str_repeat('?,', count($childIds) - 1) . '?';
            
            $sql = "SELECT i.*, s.student_id as student_number, c.full_name as student_name,
                    cl.class_name, t.term_name
                    FROM invoices i
                    JOIN students s ON i.student_id = s.id
                    JOIN children c ON s.child_id = c.id
                    JOIN classes cl ON s.class_id = cl.id
                    JOIN academic_terms t ON i.term_id = t.id
                    WHERE c.id IN ($placeholders)
                    ORDER BY i.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($childIds);
            $invoices = $stmt->fetchAll();
        }
        
        $this->render('parent/fees', [
            'pageTitle' => 'Fees & Invoices - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'invoices' => $invoices,
            'children' => $children
        ]);
    }
    
    /**
     * View Messages
     */
    public function messages() {
        $this->render('parent/messages', [
            'pageTitle' => 'Messages - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar()
        ]);
    }
    
    /**
     * View Child Academic Results
     */
    public function academics() {
        $childId = $_GET['child_id'] ?? null;
        
        if (!$childId) {
            Session::setFlash('error', 'Please select a child.', 'error');
            $this->redirect('parent', 'children');
        }
        
        $userId = Auth::id();
        $parent = $this->parentModel->getByUserId($userId);
        
        // Get child with student info
        $db = DB::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT c.*, s.id as student_id, s.student_id as student_number, 
                   cl.class_name, sec.section_name
            FROM children c
            LEFT JOIN students s ON c.id = s.child_id
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE c.id = ? AND c.parent_id = ?
        ");
        $stmt->execute([$childId, $parent['id']]);
        $child = $stmt->fetch();
        
        if (!$child) {
            Session::setFlash('error', 'Child not found.', 'error');
            $this->redirect('parent', 'children');
        }
        
        $results = [];
        $attendance = [];
        
        if ($child['student_id']) {
            // Get academic results
            $stmt = $db->prepare("
                SELECT r.*, sub.subject_name, t.term_name
                FROM results r
                JOIN subjects sub ON r.subject_id = sub.id
                JOIN academic_terms t ON r.term_id = t.id
                WHERE r.student_id = ?
                ORDER BY t.id DESC, sub.subject_name ASC
            ");
            $stmt->execute([$child['student_id']]);
            $results = $stmt->fetchAll();
            
            // Get attendance summary
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                FROM attendance
                WHERE student_id = ?
            ");
            $stmt->execute([$child['student_id']]);
            $attendance = $stmt->fetch();
        }
        
        $this->render('parent/academics', [
            'pageTitle' => 'Academic Performance - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'child' => $child,
            'results' => $results,
            'attendance' => $attendance
        ]);
    }
    
    /**
     * Apply for admission
     */
    public function applyForAdmission() {
        $childId = $_GET['child_id'] ?? null;
        
        if (!$childId) {
            Session::setFlash('error', 'Child ID is required.', 'error');
            $this->redirect('parent', 'children');
        }
        
        $child = $this->childModel->findById($childId);
        
        if (!$child) {
            Session::setFlash('error', 'Child not found.', 'error');
            $this->redirect('parent', 'children');
        }
        
        // Get available classes
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('parent/admission_form', [
            'pageTitle' => 'Apply for Admission - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'child' => $child,
            'classes' => $classes
        ]);
    }
    
    /**
     * Submit admission application
     */
    public function submitApplication() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('parent', 'children');
        }
        
        $childId = $_POST['child_id'] ?? null;
        $classId = $_POST['preferred_class_id'] ?? null;
        
        if (!$childId || !$classId) {
            Session::setFlash('error', 'Please select a class.', 'error');
            $this->redirect('parent', 'applyForAdmission', ['child_id' => $childId]);
        }
        
        $admissionModel = new Admission();
        
        // Check if application already exists
        $existing = $admissionModel->getByChild($childId);
        if ($existing && $existing['status'] === 'pending') {
            Session::setFlash('error', 'An application is already pending for this child.', 'error');
            $this->redirect('parent', 'applications');
        }
        
        $data = [
            'child_id' => $childId,
            'preferred_class_id' => $classId,
            'status' => 'pending',
            'documents' => json_encode([]) // TODO: Handle document uploads
        ];
        
        try {
            $admissionModel->insert($data);
            Session::setFlash('success', 'Application submitted successfully!', 'success');
            $this->redirect('parent', 'applications');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to submit application.', 'error');
            $this->redirect('parent', 'children');
        }
    }
    
    /**
     * Handle photo upload
     */
    private function handlePhotoUpload($file) {
        $uploadDir = UPLOADS_PATH . '/children/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('child_') . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            return 'children/' . $filename;
        }
        
        return null;
    }
    
    /**
     * Count pending applications
     */
    private function countPendingApplications($parentId) {
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM admissions a
                JOIN children c ON a.child_id = c.id
                WHERE c.parent_id = ? AND a.status = 'pending'
            ");
            $stmt->execute([$parentId]);
            return $stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Calculate outstanding fees
     */
    private function calculateOutstandingFees($parentId) {
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT SUM(i.balance) FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN children c ON s.child_id = c.id
                WHERE c.parent_id = ? AND i.status != 'paid'
            ");
            $stmt->execute([$parentId]);
            return $stmt->fetchColumn() ?? 0;
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Step 1: Start Term Enrollment (NEW - Uses InvoiceService)
     * Auto-generates draft invoice with mandatory fees
     */
    public function enrollForTerm() {
        $studentId = $_GET['student_id'] ?? null;
        
        if (!$studentId) {
            Session::setFlash('error', 'Student ID required.', 'error');
            $this->redirect('parent', 'children');
        }
        
        // Use InvoiceService to create draft invoice
        $invoiceService = new InvoiceService();
        $result = $invoiceService->createDraftInvoice($studentId);
        
        if (!$result['success']) {
            Session::setFlash('error', $result['error'], 'error');
            $this->redirect('parent', 'children');
        }
        
        // Get student details
        $db = DB::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT s.*, ch.full_name, cl.class_name
            FROM students s
            JOIN children ch ON s.child_id = ch.id
            JOIN classes cl ON s.class_id = cl.id
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();
        
        // Get active term
        $stmt = $db->query("SELECT * FROM academic_terms WHERE is_active = 1 LIMIT 1");
        $activeTerm = $stmt->fetch();
        
        // Get optional services
        $serviceModel = new OptionalService();
        $optionalServices = $serviceModel->findAll();
        
        // Get installment plans
        $planModel = new InstallmentPlan();
        $installmentPlans = $planModel->getActive();
        
        $this->render('parent/enroll_wizard_new', [
            'pageTitle' => 'Enroll for Term - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'student' => $student,
            'activeTerm' => $activeTerm,
            'invoiceId' => $result['invoice_id'],
            'mandatoryFees' => $result['mandatory_fees'],
            'totalMandatory' => $result['total_amount'],
            'optionalServices' => $optionalServices,
            'installmentPlans' => $installmentPlans
        ]);
    }
    
    /**
     * Step 2: Create Draft Invoice
     * Creates invoice with mandatory fees + selected optional services
     */
    public function createEnrollmentInvoice() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('parent', 'children');
        }
        
        $studentId = $_POST['student_id'] ?? null;
        $termId = $_POST['term_id'] ?? null;
        $optionalServices = $_POST['optional_services'] ?? [];
        $installmentPlanId = $_POST['installment_plan_id'] ?? null;
        $parentNotes = trim($_POST['parent_notes'] ?? '');
        
        if (!$studentId || !$termId || !$installmentPlanId) {
            Session::setFlash('error', 'All fields are required.', 'error');
            $this->redirect('parent', 'enrollForTerm', ['student_id' => $studentId]);
        }
        
        try {
            $db = DB::getInstance()->getConnection();
            $db->beginTransaction();
            
            // Get student class
            $stmt = $db->prepare("SELECT class_id FROM students WHERE id = ?");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();
            
            // Get mandatory fees
            $feeTypeModel = new FeeType();
            $mandatoryFees = $feeTypeModel->getByClass($student['class_id']);
            
            // Calculate total
            $totalAmount = 0;
            foreach ($mandatoryFees as $fee) {
                $totalAmount += $fee['amount'];
            }
            
            // Add optional services
            $serviceModel = new OptionalService();
            $selectedServices = [];
            foreach ($optionalServices as $serviceId) {
                $service = $serviceModel->findById($serviceId);
                if ($service) {
                    $selectedServices[] = $service;
                    $totalAmount += $service['amount'];
                }
            }
            
            // Create invoice (DRAFT status)
            $invoiceModel = new Invoice();
            $invoiceId = $invoiceModel->insert([
                'student_id' => $studentId,
                'term_id' => $termId,
                'installment_plan_id' => $installmentPlanId,
                'total_amount' => $totalAmount,
                'amount_paid' => 0,
                'balance' => $totalAmount,
                'status' => 'unpaid',
                'workflow_status' => 'draft',
                'parent_notes' => $parentNotes
            ]);
            
            // Add invoice items (mandatory fees)
            $invoiceItemModel = new InvoiceItem();
            foreach ($mandatoryFees as $fee) {
                $invoiceItemModel->insert([
                    'invoice_id' => $invoiceId,
                    'fee_type_id' => $fee['id'],
                    'label' => $fee['fee_name'],
                    'amount' => $fee['amount']
                ]);
            }
            
            // Add invoice items (optional services)
            foreach ($selectedServices as $service) {
                $invoiceItemModel->insert([
                    'invoice_id' => $invoiceId,
                    'fee_type_id' => null,
                    'label' => $service['service_name'] . ' (Optional)',
                    'amount' => $service['amount']
                ]);
                
                // Track selected services
                $stmt = $db->prepare("INSERT INTO optional_services_selected (invoice_id, service_id) VALUES (?, ?)");
                $stmt->execute([$invoiceId, $service['id']]);
            }
            
            // Create term enrollment record
            $enrollmentModel = new TermEnrollment();
            $enrollmentModel->createEnrollment($studentId, $termId, $invoiceId);
            
            $db->commit();
            
            Session::setFlash('success', 'Enrollment invoice created! Please review and submit.', 'success');
            $this->redirect('parent', 'reviewEnrollmentInvoice', ['invoice_id' => $invoiceId]);
            
        } catch (Exception $e) {
            $db->rollBack();
            Session::setFlash('error', 'Failed to create enrollment invoice: ' . $e->getMessage(), 'error');
            $this->redirect('parent', 'enrollForTerm', ['student_id' => $studentId]);
        }
    }
    
    /**
     * Step 3: Review Enrollment Invoice
     * Parent reviews draft invoice before submitting to finance
     */
    public function reviewEnrollmentInvoice() {
        $invoiceId = $_GET['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('parent', 'children');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->getWithDetails($invoiceId);
        
        if (!$invoice || $invoice['workflow_status'] !== 'draft') {
            Session::setFlash('error', 'Invoice not found or already submitted.', 'error');
            $this->redirect('parent', 'children');
        }
        
        // Get installment plan details
        $planModel = new InstallmentPlan();
        $installmentPlan = $planModel->findById($invoice['installment_plan_id']);
        $installments = $planModel->calculateInstallments($invoice['installment_plan_id'], $invoice['total_amount']);
        
        $this->render('parent/review_enrollment_invoice', [
            'pageTitle' => 'Review Enrollment Invoice - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getParentSidebar(),
            'invoice' => $invoice,
            'installmentPlan' => $installmentPlan,
            'installments' => $installments
        ]);
    }
    
    /**
     * Step 4: Submit Invoice to Finance (NEW - Uses InvoiceService)
     */
    public function submitEnrollmentInvoice() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('parent', 'children');
        }
        
        $invoiceId = $_POST['invoice_id'] ?? null;
        $optionalServices = $_POST['optional_services'] ?? [];
        $installmentPlanId = $_POST['installment_plan_id'] ?? null;
        $parentNotes = trim($_POST['parent_notes'] ?? '');
        
        if (!$invoiceId || !$installmentPlanId) {
            Session::setFlash('error', 'Please select a payment plan.', 'error');
            $this->redirect('parent', 'children');
        }
        
        $invoiceService = new InvoiceService();
        
        // Add optional services if selected
        if (!empty($optionalServices)) {
            $result = $invoiceService->addOptionalServices($invoiceId, $optionalServices);
            if (!$result['success']) {
                Session::setFlash('error', $result['error'], 'error');
                $this->redirect('parent', 'children');
            }
        }
        
        // Set installment plan
        $result = $invoiceService->setInstallmentPlan($invoiceId, $installmentPlanId);
        if (!$result['success']) {
            Session::setFlash('error', $result['error'], 'error');
            $this->redirect('parent', 'children');
        }
        
        // Submit invoice
        $result = $invoiceService->submitInvoice($invoiceId, $parentNotes);
        if (!$result['success']) {
            Session::setFlash('error', $result['error'], 'error');
            $this->redirect('parent', 'children');
        }
        
        Session::setFlash('success', 'Enrollment invoice submitted to Finance for approval!', 'success');
        $this->redirect('parent', 'fees');
    }
    
    /**
     * Get parent sidebar menu
     */
    private function getParentSidebar() {
        $currentAction = $_GET['a'] ?? 'dashboard';
        
        return [
            [
                'label' => 'Dashboard',
                'url' => APP_URL . '/index.php?c=parent&a=dashboard',
                'icon' => 'fas fa-home',
                'active' => $currentAction === 'dashboard' ? 'active' : ''
            ],
            [
                'label' => 'My Children',
                'url' => APP_URL . '/index.php?c=parent&a=children',
                'icon' => 'fas fa-child',
                'active' => $currentAction === 'children' ? 'active' : ''
            ],
            [
                'label' => 'Applications',
                'url' => APP_URL . '/index.php?c=parent&a=applications',
                'icon' => 'fas fa-file-alt',
                'active' => $currentAction === 'applications' ? 'active' : ''
            ],
            [
                'label' => 'Fees & Payments',
                'url' => APP_URL . '/index.php?c=parent&a=fees',
                'icon' => 'fas fa-money-bill',
                'active' => $currentAction === 'fees' ? 'active' : ''
            ],
            [
                'label' => 'Messages',
                'url' => APP_URL . '/index.php?c=parent&a=messages',
                'icon' => 'fas fa-envelope',
                'active' => $currentAction === 'messages' ? 'active' : ''
            ],
        ];
    }
}
