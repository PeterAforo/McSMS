<?php
/**
 * Fee Item Rule Model
 * Represents pricing rules for fee items per class/term
 */

class FeeItemRule extends Model {
    protected $table = 'fee_item_rules';
    
    /**
     * Get fee amount for a specific item, class, and term
     */
    public function getAmount($feeItemId, $classId, $termId = null) {
        $sql = "SELECT amount FROM {$this->table} 
                WHERE fee_item_id = ? AND class_id = ? AND is_active = 1";
        $params = [$feeItemId, $classId];
        
        if ($termId) {
            $sql .= " AND (term_id = ? OR term_id IS NULL) ORDER BY term_id DESC LIMIT 1";
            $params[] = $termId;
        } else {
            $sql .= " AND term_id IS NULL LIMIT 1";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        return $result ? $result['amount'] : 0;
    }
    
    /**
     * Get all mandatory fees for a class and term
     */
    public function getMandatoryFeesForClass($classId, $termId = null) {
        $sql = "SELECT fir.*, fi.name as fee_name, fi.description, fi.frequency, 
                       fg.name as group_name
                FROM {$this->table} fir
                JOIN fee_items fi ON fir.fee_item_id = fi.id
                JOIN fee_groups fg ON fi.group_id = fg.id
                WHERE fir.class_id = ? 
                AND fi.is_optional = 0 
                AND fi.is_active = 1 
                AND fir.is_active = 1";
        $params = [$classId];
        
        if ($termId) {
            $sql .= " AND (fir.term_id = ? OR fir.term_id IS NULL)";
            $params[] = $termId;
        } else {
            $sql .= " AND fir.term_id IS NULL";
        }
        
        $sql .= " ORDER BY fg.display_order ASC, fi.name ASC";
        
        return $this->query($sql, $params);
    }
    
    /**
     * Get all fee rules for a class
     */
    public function getByClass($classId) {
        $sql = "SELECT fir.*, fi.name as fee_name, fi.is_optional, 
                       fg.name as group_name
                FROM {$this->table} fir
                JOIN fee_items fi ON fir.fee_item_id = fi.id
                JOIN fee_groups fg ON fi.group_id = fg.id
                WHERE fir.class_id = ? AND fir.is_active = 1
                ORDER BY fg.display_order ASC, fi.name ASC";
        return $this->query($sql, [$classId]);
    }
    
    /**
     * Get all rules with details
     */
    public function getAllWithDetails() {
        $sql = "SELECT fir.*, fi.name as fee_name, fi.frequency, fi.is_optional,
                       fg.name as group_name, c.class_name, t.term_name
                FROM {$this->table} fir
                JOIN fee_items fi ON fir.fee_item_id = fi.id
                JOIN fee_groups fg ON fi.group_id = fg.id
                JOIN classes c ON fir.class_id = c.id
                LEFT JOIN academic_terms t ON fir.term_id = t.id
                WHERE fir.is_active = 1
                ORDER BY c.class_name ASC, fg.display_order ASC, fi.name ASC";
        return $this->query($sql);
    }
    
    /**
     * Check if rule exists
     */
    public function ruleExists($feeItemId, $classId, $termId = null, $excludeId = null) {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE fee_item_id = ? AND class_id = ?";
        $params = [$feeItemId, $classId];
        
        if ($termId) {
            $sql .= " AND term_id = ?";
            $params[] = $termId;
        } else {
            $sql .= " AND term_id IS NULL";
        }
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
}
