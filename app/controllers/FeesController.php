<?php
/**
 * Fees Controller
 * Handles finance and payment management
 */

class FeesController extends Controller {
    
    public function __construct() {
        $this->requireRole(['admin', 'finance']);
    }
    
    /**
     * Finance Dashboard
     */
    public function dashboard() {
        $stats = [
            'total_revenue' => $this->getTotalRevenue(),
            'pending_payments' => $this->getPendingPayments(),
            'paid_invoices' => $this->getPaidInvoicesCount(),
            'unpaid_invoices' => $this->getUnpaidInvoicesCount()
        ];
        
        $this->render('fees/dashboard', [
            'pageTitle' => 'Finance Dashboard - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'stats' => $stats
        ], 'modern');
    }
    
    /**
     * Fee Types Management
     */
    public function feeTypes() {
        $feeTypeModel = new FeeType();
        $feeTypes = $feeTypeModel->getAllWithClass();
        
        $this->render('fees/fee_types', [
            'pageTitle' => 'Fee Types - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'feeTypes' => $feeTypes
        ], 'modern');
    }
    
    /**
     * Optional Services Management
     */
    public function optionalServices() {
        $serviceModel = new OptionalService();
        $services = $serviceModel->findAll();
        
        $this->render('fees/optional_services', [
            'pageTitle' => 'Optional Services - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'services' => $services
        ], 'modern');
    }
    
    /**
     * Create Fee Type Form
     */
    public function createFeeType() {
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('fees/fee_type_form', [
            'pageTitle' => 'Create Fee Type - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'feeType' => null,
            'classes' => $classes
        ], 'modern');
    }
    
    /**
     * Edit Fee Type Form
     */
    public function editFeeType() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Fee Type ID required.', 'error');
            $this->redirect('fees', 'feeTypes');
        }
        
        $feeTypeModel = new FeeType();
        $feeType = $feeTypeModel->findById($id);
        
        if (!$feeType) {
            Session::setFlash('error', 'Fee Type not found.', 'error');
            $this->redirect('fees', 'feeTypes');
        }
        
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('fees/fee_type_form', [
            'pageTitle' => 'Edit Fee Type - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'feeType' => $feeType,
            'classes' => $classes
        ], 'modern');
    }
    
    /**
     * Store Fee Type
     */
    public function storeFeeType() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'feeTypes');
        }
        
        $feeTypeModel = new FeeType();
        $feeTypeId = $_POST['fee_type_id'] ?? null;
        
        $data = [
            'fee_name' => trim($_POST['fee_name'] ?? ''),
            'amount' => floatval($_POST['amount'] ?? 0),
            'class_id' => $_POST['class_id'] ?? null
        ];
        
        if (empty($data['fee_name']) || $data['amount'] <= 0 || !$data['class_id']) {
            Session::setFlash('error', 'All fields are required and amount must be greater than 0.', 'error');
            $this->redirect('fees', $feeTypeId ? 'editFeeType' : 'createFeeType');
        }
        
        try {
            if ($feeTypeId) {
                $feeTypeModel->update($feeTypeId, $data);
                Session::setFlash('success', 'Fee Type updated successfully!', 'success');
            } else {
                $feeTypeModel->insert($data);
                Session::setFlash('success', 'Fee Type created successfully!', 'success');
            }
            
            $this->redirect('fees', 'feeTypes');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save fee type.', 'error');
            $this->redirect('fees', $feeTypeId ? 'editFeeType' : 'createFeeType');
        }
    }
    
    /**
     * Delete Fee Type
     */
    public function deleteFeeType() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Fee Type ID required.', 'error');
            $this->redirect('fees', 'feeTypes');
        }
        
        $feeTypeModel = new FeeType();
        
        try {
            $feeTypeModel->delete($id);
            Session::setFlash('success', 'Fee Type deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete fee type. It may be used in invoices.', 'error');
        }
        
        $this->redirect('fees', 'feeTypes');
    }
    
    /**
     * Create Optional Service Form
     */
    public function createService() {
        $this->render('fees/service_form', [
            'pageTitle' => 'Create Optional Service - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'service' => null
        ], 'modern');
    }
    
    /**
     * Edit Optional Service Form
     */
    public function editService() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Service ID required.', 'error');
            $this->redirect('fees', 'optionalServices');
        }
        
        $serviceModel = new OptionalService();
        $service = $serviceModel->findById($id);
        
        if (!$service) {
            Session::setFlash('error', 'Service not found.', 'error');
            $this->redirect('fees', 'optionalServices');
        }
        
        $this->render('fees/service_form', [
            'pageTitle' => 'Edit Optional Service - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'service' => $service
        ], 'modern');
    }
    
    /**
     * Store Optional Service
     */
    public function storeService() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'optionalServices');
        }
        
        $serviceModel = new OptionalService();
        $serviceId = $_POST['service_id'] ?? null;
        
        $data = [
            'service_name' => trim($_POST['service_name'] ?? ''),
            'amount' => floatval($_POST['amount'] ?? 0),
            'description' => trim($_POST['description'] ?? '')
        ];
        
        if (empty($data['service_name']) || $data['amount'] <= 0) {
            Session::setFlash('error', 'Service name and amount are required.', 'error');
            $this->redirect('fees', $serviceId ? 'editService' : 'createService');
        }
        
        try {
            if ($serviceId) {
                $serviceModel->update($serviceId, $data);
                Session::setFlash('success', 'Optional Service updated successfully!', 'success');
            } else {
                $serviceModel->insert($data);
                Session::setFlash('success', 'Optional Service created successfully!', 'success');
            }
            
            $this->redirect('fees', 'optionalServices');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save service.', 'error');
            $this->redirect('fees', $serviceId ? 'editService' : 'createService');
        }
    }
    
    /**
     * Delete Optional Service
     */
    public function deleteService() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Service ID required.', 'error');
            $this->redirect('fees', 'optionalServices');
        }
        
        $serviceModel = new OptionalService();
        
        try {
            $serviceModel->delete($id);
            Session::setFlash('success', 'Optional Service deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete service.', 'error');
        }
        
        $this->redirect('fees', 'optionalServices');
    }
    
    /**
     * Invoices List
     */
    public function invoices() {
        $invoiceModel = new Invoice();
        $invoices = $invoiceModel->getAllWithDetails();
        
        $this->render('fees/invoices_list', [
            'pageTitle' => 'Invoices - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoices' => $invoices
        ], 'modern');
    }
    
    /**
     * View Invoice
     */
    public function viewInvoice() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->getWithDetails($id);
        
        if (!$invoice) {
            Session::setFlash('error', 'Invoice not found.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $this->render('fees/invoice_view', [
            'pageTitle' => 'Invoice Details - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoice' => $invoice
        ], 'modern');
    }
    
    /**
     * Record Payment
     */
    public function recordPayment() {
        $invoiceId = $_GET['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->getWithDetails($invoiceId);
        
        $this->render('fees/payment_form', [
            'pageTitle' => 'Record Payment - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoice' => $invoice
        ], 'modern');
    }
    
    /**
     * Store Payment
     */
    public function storePayment() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceId = $_POST['invoice_id'] ?? null;
        $amount = floatval($_POST['amount'] ?? 0);
        $paymentMethod = $_POST['payment_method'] ?? '';
        $referenceNo = trim($_POST['reference_no'] ?? '');
        
        if (!$invoiceId || $amount <= 0) {
            Session::setFlash('error', 'Invalid payment data.', 'error');
            $this->redirect('fees', 'recordPayment', ['invoice_id' => $invoiceId]);
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->findById($invoiceId);
        
        if ($amount > $invoice['balance']) {
            Session::setFlash('error', 'Payment amount exceeds balance.', 'error');
            $this->redirect('fees', 'recordPayment', ['invoice_id' => $invoiceId]);
        }
        
        try {
            $paymentModel = new Payment();
            $paymentModel->insert([
                'invoice_id' => $invoiceId,
                'student_id' => $invoice['student_id'],
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'reference_no' => $referenceNo,
                'received_by' => Auth::id()
            ]);
            
            // Update invoice
            $newAmountPaid = $invoice['amount_paid'] + $amount;
            $newBalance = $invoice['total_amount'] - $newAmountPaid;
            $newStatus = $newBalance <= 0 ? 'paid' : ($newAmountPaid > 0 ? 'partial' : 'unpaid');
            
            $invoiceModel->update($invoiceId, [
                'amount_paid' => $newAmountPaid,
                'balance' => $newBalance,
                'status' => $newStatus
            ]);
            
            Session::setFlash('success', 'Payment recorded successfully!', 'success');
            $this->redirect('fees', 'viewInvoice', ['id' => $invoiceId]);
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to record payment.', 'error');
            $this->redirect('fees', 'recordPayment', ['invoice_id' => $invoiceId]);
        }
    }
    
    /**
     * Create Invoice Form
     */
    public function createInvoice() {
        $db = DB::getInstance()->getConnection();
        
        // Get all enrolled students
        $stmt = $db->query("
            SELECT s.id, s.student_id as student_number, c.full_name, 
                   cl.class_name, sec.section_name
            FROM students s
            JOIN children c ON s.child_id = c.id
            JOIN classes cl ON s.class_id = cl.id
            JOIN sections sec ON s.section_id = sec.id
            WHERE s.status = 'active'
            ORDER BY c.full_name ASC
        ");
        $students = $stmt->fetchAll();
        
        // Get terms
        $stmt = $db->query("SELECT * FROM academic_terms ORDER BY id ASC");
        $terms = $stmt->fetchAll();
        
        $this->render('fees/invoice_form', [
            'pageTitle' => 'Create Invoice - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoice' => null,
            'students' => $students,
            'terms' => $terms
        ], 'modern');
    }
    
    /**
     * Edit Invoice Form
     */
    public function editInvoice() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->getWithDetails($id);
        
        if (!$invoice) {
            Session::setFlash('error', 'Invoice not found.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT * FROM academic_terms ORDER BY id ASC");
        $terms = $stmt->fetchAll();
        
        $this->render('fees/invoice_form', [
            'pageTitle' => 'Edit Invoice - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoice' => $invoice,
            'students' => [],
            'terms' => $terms
        ], 'modern');
    }
    
    /**
     * Store Invoice
     */
    public function storeInvoice() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceId = $_POST['invoice_id'] ?? null;
        $studentId = $_POST['student_id'] ?? null;
        $termId = $_POST['term_id'] ?? null;
        $items = $_POST['items'] ?? [];
        
        if (!$studentId || !$termId || empty($items)) {
            Session::setFlash('error', 'All fields are required.', 'error');
            $this->redirect('fees', $invoiceId ? 'editInvoice' : 'createInvoice');
        }
        
        try {
            $totalAmount = 0;
            foreach ($items as $item) {
                if (!empty($item['label']) && !empty($item['amount'])) {
                    $totalAmount += floatval($item['amount']);
                }
            }
            
            $invoiceModel = new Invoice();
            
            if ($invoiceId) {
                // Update existing invoice
                $invoice = $invoiceModel->findById($invoiceId);
                $balance = $totalAmount - $invoice['amount_paid'];
                $status = $balance <= 0 ? 'paid' : ($invoice['amount_paid'] > 0 ? 'partial' : 'unpaid');
                
                $invoiceModel->update($invoiceId, [
                    'term_id' => $termId,
                    'total_amount' => $totalAmount,
                    'balance' => $balance,
                    'status' => $status
                ]);
                
                // Delete old items
                $db = DB::getInstance()->getConnection();
                $stmt = $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
                $stmt->execute([$invoiceId]);
                
                $newInvoiceId = $invoiceId;
            } else {
                // Create new invoice
                $newInvoiceId = $invoiceModel->insert([
                    'student_id' => $studentId,
                    'term_id' => $termId,
                    'total_amount' => $totalAmount,
                    'amount_paid' => 0,
                    'balance' => $totalAmount,
                    'status' => 'unpaid'
                ]);
            }
            
            // Create invoice items
            $invoiceItemModel = new InvoiceItem();
            foreach ($items as $item) {
                if (!empty($item['label']) && !empty($item['amount'])) {
                    $invoiceItemModel->insert([
                        'invoice_id' => $newInvoiceId,
                        'fee_type_id' => null,
                        'label' => trim($item['label']),
                        'amount' => floatval($item['amount'])
                    ]);
                }
            }
            
            Session::setFlash('success', 'Invoice saved successfully!', 'success');
            $this->redirect('fees', 'viewInvoice', ['id' => $newInvoiceId]);
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save invoice: ' . $e->getMessage(), 'error');
            $this->redirect('fees', $invoiceId ? 'editInvoice' : 'createInvoice');
        }
    }
    
    /**
     * Delete Invoice
     */
    public function deleteInvoice() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->findById($id);
        
        // Check if invoice has payments
        if ($invoice && $invoice['amount_paid'] > 0) {
            Session::setFlash('error', 'Cannot delete invoice with payments. Please void payments first.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        try {
            $invoiceModel->delete($id);
            Session::setFlash('success', 'Invoice deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete invoice.', 'error');
        }
        
        $this->redirect('fees', 'invoices');
    }
    
    /**
     * Generate Invoice (Auto)
     */
    public function generateInvoice() {
        $studentId = $_GET['student_id'] ?? null;
        $termId = $_GET['term_id'] ?? 1;
        
        if (!$studentId) {
            Session::setFlash('error', 'Student ID required.', 'error');
            $this->redirect('fees', 'invoices');
        }
        
        try {
            $studentModel = new Student();
            $student = $studentModel->getWithDetails($studentId);
            
            // Get fee types for class
            $feeTypeModel = new FeeType();
            $feeTypes = $feeTypeModel->getByClass($student['class_id']);
            
            $totalAmount = 0;
            foreach ($feeTypes as $fee) {
                $totalAmount += $fee['amount'];
            }
            
            // Create invoice
            $invoiceModel = new Invoice();
            $invoiceId = $invoiceModel->insert([
                'student_id' => $studentId,
                'term_id' => $termId,
                'total_amount' => $totalAmount,
                'amount_paid' => 0,
                'balance' => $totalAmount,
                'status' => 'unpaid'
            ]);
            
            // Create invoice items
            $invoiceItemModel = new InvoiceItem();
            foreach ($feeTypes as $fee) {
                $invoiceItemModel->insert([
                    'invoice_id' => $invoiceId,
                    'fee_type_id' => $fee['id'],
                    'label' => $fee['fee_name'],
                    'amount' => $fee['amount']
                ]);
            }
            
            Session::setFlash('success', 'Invoice generated successfully!', 'success');
            $this->redirect('fees', 'viewInvoice', ['id' => $invoiceId]);
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to generate invoice.', 'error');
            $this->redirect('fees', 'invoices');
        }
    }
    
    /**
     * ENROLLMENT INVOICE APPROVAL WORKFLOW
     */
    
    /**
     * View Pending Enrollment Invoices
     */
    public function pendingInvoices() {
        $db = DB::getInstance()->getConnection();
        
        $stmt = $db->query("
            SELECT i.*, s.student_id as student_number, ch.full_name as student_name,
                   cl.class_name, t.term_name, ip.name as plan_name
            FROM invoices i
            JOIN students s ON i.student_id = s.id
            JOIN children ch ON s.child_id = ch.id
            JOIN classes cl ON s.class_id = cl.id
            JOIN academic_terms t ON i.term_id = t.id
            LEFT JOIN installment_plans ip ON i.installment_plan_id = ip.id
            WHERE i.workflow_status = 'pending_finance'
            ORDER BY i.created_at DESC
        ");
        $pendingInvoices = $stmt->fetchAll();
        
        $this->render('fees/pending_invoices', [
            'pageTitle' => 'Pending Enrollment Invoices - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'pendingInvoices' => $pendingInvoices
        ], 'modern');
    }
    
    /**
     * View Invoice for Approval
     */
    public function reviewInvoice() {
        $invoiceId = $_GET['id'] ?? null;
        
        if (!$invoiceId) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'pendingInvoices');
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->getWithDetails($invoiceId);
        
        if (!$invoice) {
            Session::setFlash('error', 'Invoice not found.', 'error');
            $this->redirect('fees', 'pendingInvoices');
        }
        
        // Get installment plan details
        $planModel = new InstallmentPlan();
        $installmentPlan = null;
        $installments = [];
        
        if ($invoice['installment_plan_id']) {
            $installmentPlan = $planModel->findById($invoice['installment_plan_id']);
            $installments = $planModel->calculateInstallments($invoice['installment_plan_id'], $invoice['total_amount']);
        }
        
        // Get optional services selected
        $db = DB::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT os.service_name, os.amount
            FROM optional_services_selected oss
            JOIN optional_services os ON oss.service_id = os.id
            WHERE oss.invoice_id = ?
        ");
        $stmt->execute([$invoiceId]);
        $optionalServices = $stmt->fetchAll();
        
        $this->render('fees/review_invoice', [
            'pageTitle' => 'Review Invoice - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getFinanceSidebar(),
            'invoice' => $invoice,
            'installmentPlan' => $installmentPlan,
            'installments' => $installments,
            'optionalServices' => $optionalServices
        ], 'modern');
    }
    
    /**
     * Approve Enrollment Invoice
     */
    public function approveEnrollmentInvoice() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'pendingInvoices');
        }
        
        $invoiceId = $_POST['invoice_id'] ?? null;
        $financeNotes = trim($_POST['finance_notes'] ?? '');
        
        if (!$invoiceId) {
            Session::setFlash('error', 'Invoice ID required.', 'error');
            $this->redirect('fees', 'pendingInvoices');
        }
        
        try {
            $db = DB::getInstance()->getConnection();
            $db->beginTransaction();
            
            // Update invoice workflow status
            $invoiceModel = new Invoice();
            $invoiceModel->update($invoiceId, [
                'workflow_status' => 'approved',
                'finance_notes' => $financeNotes
            ]);
            
            // Get invoice to find student and term
            $invoice = $invoiceModel->findById($invoiceId);
            
            // Update term enrollment status
            $stmt = $db->prepare("
                UPDATE term_enrollments 
                SET enrollment_status = 'enrolled', enrolled_at = NOW()
                WHERE invoice_id = ?
            ");
            $stmt->execute([$invoiceId]);
            
            $db->commit();
            
            Session::setFlash('success', 'Invoice approved! Student is now enrolled for the term.', 'success');
            $this->redirect('fees', 'pendingInvoices');
            
        } catch (Exception $e) {
            $db->rollBack();
            Session::setFlash('error', 'Failed to approve invoice: ' . $e->getMessage(), 'error');
            $this->redirect('fees', 'reviewInvoice', ['id' => $invoiceId]);
        }
    }
    
    /**
     * Reject Enrollment Invoice
     */
    public function rejectEnrollmentInvoice() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('fees', 'pendingInvoices');
        }
        
        $invoiceId = $_POST['invoice_id'] ?? null;
        $financeNotes = trim($_POST['finance_notes'] ?? '');
        
        if (!$invoiceId || empty($financeNotes)) {
            Session::setFlash('error', 'Invoice ID and rejection reason are required.', 'error');
            $this->redirect('fees', 'pendingInvoices');
        }
        
        try {
            $invoiceModel = new Invoice();
            $invoiceModel->update($invoiceId, [
                'workflow_status' => 'rejected',
                'finance_notes' => $financeNotes
            ]);
            
            Session::setFlash('success', 'Invoice rejected. Parent has been notified.', 'success');
            $this->redirect('fees', 'pendingInvoices');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to reject invoice.', 'error');
            $this->redirect('fees', 'reviewInvoice', ['id' => $invoiceId]);
        }
    }
    
    /**
     * Get statistics
     */
    private function getTotalRevenue() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT SUM(amount_paid) FROM invoices");
        return $stmt->fetchColumn() ?? 0;
    }
    
    private function getPendingPayments() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT SUM(balance) FROM invoices WHERE status != 'paid'");
        return $stmt->fetchColumn() ?? 0;
    }
    
    private function getPaidInvoicesCount() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT COUNT(*) FROM invoices WHERE status = 'paid'");
        return $stmt->fetchColumn();
    }
    
    private function getUnpaidInvoicesCount() {
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT COUNT(*) FROM invoices WHERE status = 'unpaid'");
        return $stmt->fetchColumn();
    }
    
    /**
     * Finance sidebar
     */
    private function getFinanceSidebar() {
        $currentAction = $_GET['a'] ?? 'dashboard';
        
        // Get pending invoices count
        $db = DB::getInstance()->getConnection();
        $stmt = $db->query("SELECT COUNT(*) FROM invoices WHERE workflow_status = 'pending_finance'");
        $pendingCount = $stmt->fetchColumn();
        
        return [
            ['label' => 'Dashboard', 'url' => APP_URL . '/index.php?c=fees&a=dashboard', 'icon' => 'fas fa-tachometer-alt', 'active' => $currentAction === 'dashboard' ? 'active' : ''],
            ['label' => 'Pending Invoices' . ($pendingCount > 0 ? ' (' . $pendingCount . ')' : ''), 'url' => APP_URL . '/index.php?c=fees&a=pendingInvoices', 'icon' => 'fas fa-clock', 'active' => $currentAction === 'pendingInvoices' || $currentAction === 'reviewInvoice' ? 'active' : ''],
            ['label' => 'All Invoices', 'url' => APP_URL . '/index.php?c=fees&a=invoices', 'icon' => 'fas fa-file-invoice', 'active' => $currentAction === 'invoices' ? 'active' : ''],
            ['label' => 'Fee Types', 'url' => APP_URL . '/index.php?c=fees&a=feeTypes', 'icon' => 'fas fa-tags', 'active' => $currentAction === 'feeTypes' ? 'active' : ''],
            ['label' => 'Optional Services', 'url' => APP_URL . '/index.php?c=fees&a=optionalServices', 'icon' => 'fas fa-plus-circle', 'active' => $currentAction === 'optionalServices' ? 'active' : ''],
        ];
    }
}
