<?php
/**
 * Fee Structure Controller
 * Manages fee groups, items, and rules (Admin only)
 */

class FeeStructureController extends Controller {
    private $feeGroupModel;
    private $feeItemModel;
    private $feeItemRuleModel;
    private $classModel;
    
    public function __construct() {
        $this->requireRole('admin');
        $this->feeGroupModel = new FeeGroup();
        $this->feeItemModel = new FeeItem();
        $this->feeItemRuleModel = new FeeItemRule();
        $this->classModel = new ClassModel();
    }
    
    /**
     * Fee Structure Dashboard
     */
    public function index() {
        $stats = [
            'total_groups' => count($this->feeGroupModel->getActive()),
            'total_items' => count($this->feeItemModel->findAll(['is_active' => 1])),
            'mandatory_items' => count($this->feeItemModel->getMandatory()),
            'optional_items' => count($this->feeItemModel->getOptional())
        ];
        
        $this->render('fee_structure/dashboard', [
            'pageTitle' => 'Fee Structure Management - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'stats' => $stats
        ], 'modern');
    }
    
    /**
     * Fee Groups Management
     */
    public function groups() {
        $groups = $this->feeGroupModel->getAllWithItems();
        
        $this->render('fee_structure/groups', [
            'pageTitle' => 'Fee Groups - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'groups' => $groups
        ], 'modern');
    }
    
    /**
     * Fee Items Management
     */
    public function items() {
        $items = $this->feeItemModel->getAllWithGroups();
        
        $this->render('fee_structure/items', [
            'pageTitle' => 'Fee Items - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'items' => $items
        ], 'modern');
    }
    
    /**
     * Fee Rules Management (Class-based pricing)
     */
    public function rules() {
        $rules = $this->feeItemRuleModel->getAllWithDetails();
        $classes = $this->classModel->findAll([], 'level ASC, class_name ASC');
        $items = $this->feeItemModel->getAllWithGroups();
        
        $this->render('fee_structure/rules', [
            'pageTitle' => 'Fee Rules - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'rules' => $rules,
            'classes' => $classes,
            'items' => $items
        ], 'modern');
    }
    
    /**
     * Create/Edit Fee Rule
     */
    public function editRule() {
        $ruleId = $_GET['id'] ?? null;
        $rule = $ruleId ? $this->feeItemRuleModel->findById($ruleId) : null;
        
        $classes = $this->classModel->findAll([], 'level ASC, class_name ASC');
        $items = $this->feeItemModel->getAllWithGroups();
        
        // Get terms for term-specific pricing
        $db = DB::getInstance()->getConnection();
        $terms = $db->query("SELECT * FROM academic_terms ORDER BY id DESC")->fetchAll();
        
        $this->render('fee_structure/rule_form', [
            'pageTitle' => ($rule ? 'Edit' : 'Create') . ' Fee Rule - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'rule' => $rule,
            'classes' => $classes,
            'items' => $items,
            'terms' => $terms
        ], 'modern');
    }
    
    /**
     * Save Fee Rule
     */
    public function saveRule() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('feeStructure', 'rules');
        }
        
        $ruleId = $_POST['id'] ?? null;
        $feeItemId = $_POST['fee_item_id'] ?? null;
        $classId = $_POST['class_id'] ?? null;
        $termId = $_POST['term_id'] ?? null;
        $amount = $_POST['amount'] ?? 0;
        
        // Validation
        if (!$feeItemId || !$classId || $amount <= 0) {
            Session::setFlash('error', 'All fields are required and amount must be greater than 0.', 'error');
            $this->redirect('feeStructure', 'editRule', $ruleId ? ['id' => $ruleId] : []);
        }
        
        // Check for duplicates
        if ($this->feeItemRuleModel->ruleExists($feeItemId, $classId, $termId, $ruleId)) {
            Session::setFlash('error', 'A rule already exists for this combination.', 'error');
            $this->redirect('feeStructure', 'editRule', $ruleId ? ['id' => $ruleId] : []);
        }
        
        $data = [
            'fee_item_id' => $feeItemId,
            'class_id' => $classId,
            'term_id' => $termId ?: null,
            'amount' => $amount,
            'is_active' => 1
        ];
        
        try {
            if ($ruleId) {
                $this->feeItemRuleModel->update($ruleId, $data);
                Session::setFlash('success', 'Fee rule updated successfully!', 'success');
            } else {
                $this->feeItemRuleModel->insert($data);
                Session::setFlash('success', 'Fee rule created successfully!', 'success');
            }
            
            $this->redirect('feeStructure', 'rules');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save fee rule: ' . $e->getMessage(), 'error');
            $this->redirect('feeStructure', 'editRule', $ruleId ? ['id' => $ruleId] : []);
        }
    }
    
    /**
     * Delete Fee Rule
     */
    public function deleteRule() {
        $ruleId = $_GET['id'] ?? null;
        
        if (!$ruleId) {
            Session::setFlash('error', 'Rule ID is required.', 'error');
            $this->redirect('feeStructure', 'rules');
        }
        
        try {
            $this->feeItemRuleModel->delete($ruleId);
            Session::setFlash('success', 'Fee rule deleted successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to delete fee rule.', 'error');
        }
        
        $this->redirect('feeStructure', 'rules');
    }
    
    /**
     * Bulk Set Rules for a Class
     */
    public function bulkSetRules() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('feeStructure', 'rules');
        }
        
        $classId = $_POST['class_id'] ?? null;
        $rules = $_POST['rules'] ?? [];
        
        if (!$classId || empty($rules)) {
            Session::setFlash('error', 'Please select a class and set at least one fee amount.', 'error');
            $this->redirect('feeStructure', 'rules');
        }
        
        try {
            $db = DB::getInstance()->getConnection();
            $db->beginTransaction();
            
            $created = 0;
            $updated = 0;
            
            foreach ($rules as $feeItemId => $amount) {
                if ($amount > 0) {
                    // Check if rule exists
                    $existing = $this->feeItemRuleModel->query(
                        "SELECT id FROM fee_item_rules WHERE fee_item_id = ? AND class_id = ? AND term_id IS NULL",
                        [$feeItemId, $classId]
                    );
                    
                    if ($existing) {
                        // Update
                        $this->feeItemRuleModel->update($existing[0]['id'], ['amount' => $amount]);
                        $updated++;
                    } else {
                        // Create
                        $this->feeItemRuleModel->insert([
                            'fee_item_id' => $feeItemId,
                            'class_id' => $classId,
                            'term_id' => null,
                            'amount' => $amount,
                            'is_active' => 1
                        ]);
                        $created++;
                    }
                }
            }
            
            $db->commit();
            
            Session::setFlash('success', "Fee rules saved! Created: {$created}, Updated: {$updated}", 'success');
            
        } catch (Exception $e) {
            $db->rollBack();
            Session::setFlash('error', 'Failed to save fee rules: ' . $e->getMessage(), 'error');
        }
        
        $this->redirect('feeStructure', 'rules');
    }
    
    /**
     * Get admin sidebar
     */
    private function getAdminSidebar() {
        $currentAction = $_GET['a'] ?? 'index';
        
        return [
            ['label' => 'Dashboard', 'url' => APP_URL . '/index.php?c=admin&a=dashboard', 'icon' => 'fas fa-home', 'active' => ''],
            ['label' => 'Fee Structure', 'url' => APP_URL . '/index.php?c=feeStructure', 'icon' => 'fas fa-money-bill-wave', 'active' => 'active'],
            ['label' => 'Users', 'url' => APP_URL . '/index.php?c=admin&a=users', 'icon' => 'fas fa-users', 'active' => ''],
            ['label' => 'Classes', 'url' => APP_URL . '/index.php?c=classes', 'icon' => 'fas fa-school', 'active' => ''],
        ];
    }
}
