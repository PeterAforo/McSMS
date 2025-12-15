<?php
/**
 * Invoice Service
 * Core business logic for invoice generation and management
 */

class InvoiceService {
    private $db;
    private $invoiceModel;
    private $feeItemRuleModel;
    private $enrollmentModel;
    
    public function __construct() {
        $this->db = DB::getInstance()->getConnection();
        $this->invoiceModel = new Invoice();
        $this->feeItemRuleModel = new FeeItemRule();
        $this->enrollmentModel = new TermEnrollment();
    }
    
    /**
     * STEP 1: Create Draft Invoice for Term Enrollment
     * Auto-loads mandatory fees for student's class
     */
    public function createDraftInvoice($studentId) {
        try {
            $this->db->beginTransaction();
            
            // Get student details
            $stmt = $this->db->prepare("
                SELECT s.*, c.id as class_id, c.class_name
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();
            
            if (!$student) {
                throw new Exception("Student not found");
            }
            
            // Get active term
            $stmt = $this->db->query("SELECT * FROM academic_terms WHERE is_active = 1 LIMIT 1");
            $activeTerm = $stmt->fetch();
            
            if (!$activeTerm) {
                throw new Exception("No active term found");
            }
            
            // Check if already has an enrollment (any status)
            $existingEnrollment = $this->enrollmentModel->getWithDetails($studentId, $activeTerm['id']);
            if ($existingEnrollment) {
                throw new Exception("Student already has an enrollment for this term (Status: " . $existingEnrollment['enrollment_status'] . ")");
            }
            
            // Get mandatory fees for this class/term
            $mandatoryFees = $this->feeItemRuleModel->getMandatoryFeesForClass(
                $student['class_id'], 
                $activeTerm['id']
            );
            
            if (empty($mandatoryFees)) {
                throw new Exception("No fee structure defined for this class");
            }
            
            // Calculate total mandatory amount
            $totalAmount = 0;
            foreach ($mandatoryFees as $fee) {
                $totalAmount += $fee['amount'];
            }
            
            // Create draft invoice
            $invoiceId = $this->invoiceModel->insert([
                'student_id' => $studentId,
                'term_id' => $activeTerm['id'],
                'total_amount' => $totalAmount,
                'amount_paid' => 0,
                'balance' => $totalAmount,
                'status' => 'unpaid',
                'workflow_status' => 'draft'
            ]);
            
            // Insert invoice items (mandatory fees)
            $invoiceItemModel = new InvoiceItem();
            foreach ($mandatoryFees as $fee) {
                $invoiceItemModel->insert([
                    'invoice_id' => $invoiceId,
                    'fee_type_id' => null, // Using new structure
                    'label' => $fee['fee_name'] . ' (' . $fee['group_name'] . ')',
                    'amount' => $fee['amount'],
                    'metadata' => json_encode([
                        'fee_item_id' => $fee['fee_item_id'],
                        'fee_item_rule_id' => $fee['id'],
                        'frequency' => $fee['frequency']
                    ])
                ]);
            }
            
            // Create term enrollment record
            $this->enrollmentModel->createEnrollment($studentId, $activeTerm['id'], $invoiceId);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'invoice_id' => $invoiceId,
                'total_amount' => $totalAmount,
                'mandatory_fees' => $mandatoryFees
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * STEP 2: Add Optional Services to Invoice
     */
    public function addOptionalServices($invoiceId, $serviceIds) {
        try {
            $this->db->beginTransaction();
            
            // Verify invoice is still in draft
            $invoice = $this->invoiceModel->findById($invoiceId);
            if (!$invoice || $invoice['workflow_status'] !== 'draft') {
                throw new Exception("Invoice cannot be modified");
            }
            
            $serviceModel = new OptionalService();
            $invoiceItemModel = new InvoiceItem();
            $additionalAmount = 0;
            
            foreach ($serviceIds as $serviceId) {
                $service = $serviceModel->findById($serviceId);
                if ($service) {
                    // Add to invoice items
                    $invoiceItemModel->insert([
                        'invoice_id' => $invoiceId,
                        'fee_type_id' => null,
                        'label' => $service['service_name'] . ' (Optional)',
                        'amount' => $service['amount'],
                        'metadata' => json_encode([
                            'optional_service_id' => $service['id']
                        ])
                    ]);
                    
                    // Track in optional_services_selected
                    $stmt = $this->db->prepare("
                        INSERT INTO optional_services_selected (invoice_id, service_id) 
                        VALUES (?, ?)
                    ");
                    $stmt->execute([$invoiceId, $serviceId]);
                    
                    $additionalAmount += $service['amount'];
                }
            }
            
            // Update invoice total
            $newTotal = $invoice['total_amount'] + $additionalAmount;
            $this->invoiceModel->update($invoiceId, [
                'total_amount' => $newTotal,
                'balance' => $newTotal
            ]);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'additional_amount' => $additionalAmount,
                'new_total' => $newTotal
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * STEP 3: Set Installment Plan
     */
    public function setInstallmentPlan($invoiceId, $planId) {
        try {
            $invoice = $this->invoiceModel->findById($invoiceId);
            if (!$invoice || $invoice['workflow_status'] !== 'draft') {
                throw new Exception("Invoice cannot be modified");
            }
            
            $planModel = new InstallmentPlan();
            $plan = $planModel->findById($planId);
            
            if (!$plan) {
                throw new Exception("Invalid installment plan");
            }
            
            $this->invoiceModel->update($invoiceId, [
                'installment_plan_id' => $planId
            ]);
            
            return [
                'success' => true,
                'plan' => $plan,
                'installments' => $planModel->calculateInstallments($planId, $invoice['total_amount'])
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * STEP 4: Submit Invoice to Finance
     */
    public function submitInvoice($invoiceId, $parentNotes = '') {
        try {
            $invoice = $this->invoiceModel->findById($invoiceId);
            if (!$invoice || $invoice['workflow_status'] !== 'draft') {
                throw new Exception("Invoice cannot be submitted");
            }
            
            if (!$invoice['installment_plan_id']) {
                throw new Exception("Please select a payment plan");
            }
            
            $this->invoiceModel->update($invoiceId, [
                'workflow_status' => 'pending_finance',
                'parent_notes' => $parentNotes
            ]);
            
            return [
                'success' => true,
                'message' => 'Invoice submitted to Finance for approval'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * STEP 5: Finance Approves Invoice
     */
    public function approveInvoice($invoiceId, $financeNotes = '') {
        try {
            $this->db->beginTransaction();
            
            $invoice = $this->invoiceModel->findById($invoiceId);
            if (!$invoice || $invoice['workflow_status'] !== 'pending_finance') {
                throw new Exception("Invoice cannot be approved");
            }
            
            // Update invoice
            $this->invoiceModel->update($invoiceId, [
                'workflow_status' => 'approved',
                'finance_notes' => $financeNotes
            ]);
            
            // Update enrollment status
            $stmt = $this->db->prepare("
                UPDATE term_enrollments 
                SET enrollment_status = 'enrolled', enrolled_at = NOW()
                WHERE invoice_id = ?
            ");
            $stmt->execute([$invoiceId]);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'Invoice approved and student enrolled'
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get invoice summary with all details
     */
    public function getInvoiceSummary($invoiceId) {
        $invoice = $this->invoiceModel->getWithDetails($invoiceId);
        
        if (!$invoice) {
            return null;
        }
        
        // Get installment plan if set
        if ($invoice['installment_plan_id']) {
            $planModel = new InstallmentPlan();
            $invoice['installment_plan'] = $planModel->findById($invoice['installment_plan_id']);
            $invoice['installments'] = $planModel->calculateInstallments(
                $invoice['installment_plan_id'], 
                $invoice['total_amount']
            );
        }
        
        // Separate mandatory and optional items
        $invoice['mandatory_items'] = [];
        $invoice['optional_items'] = [];
        
        foreach ($invoice['items'] as $item) {
            if (strpos($item['label'], '(Optional)') !== false) {
                $invoice['optional_items'][] = $item;
            } else {
                $invoice['mandatory_items'][] = $item;
            }
        }
        
        return $invoice;
    }
}
