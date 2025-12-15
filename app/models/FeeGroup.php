<?php
/**
 * Fee Group Model
 * Represents categories of fees (Tuition, ICT, PTA, etc.)
 */

class FeeGroup extends Model {
    protected $table = 'fee_groups';
    
    /**
     * Get all active fee groups
     */
    public function getActive() {
        return $this->findAll(['is_active' => 1], 'display_order ASC, name ASC');
    }
    
    /**
     * Get fee group with its items
     */
    public function getWithItems($groupId) {
        $group = $this->findById($groupId);
        
        if ($group) {
            $sql = "SELECT * FROM fee_items WHERE group_id = ? AND is_active = 1 ORDER BY name ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$groupId]);
            $group['items'] = $stmt->fetchAll();
        }
        
        return $group;
    }
    
    /**
     * Get all groups with their items
     */
    public function getAllWithItems() {
        $groups = $this->getActive();
        
        foreach ($groups as &$group) {
            $sql = "SELECT * FROM fee_items WHERE group_id = ? AND is_active = 1 ORDER BY name ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$group['id']]);
            $group['items'] = $stmt->fetchAll();
        }
        
        return $groups;
    }
}
