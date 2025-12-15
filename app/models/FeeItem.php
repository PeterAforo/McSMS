<?php
/**
 * Fee Item Model
 * Represents individual fee types (Grade 1 Tuition, ICT Fee, etc.)
 */

class FeeItem extends Model {
    protected $table = 'fee_items';
    
    /**
     * Get all mandatory fee items
     */
    public function getMandatory() {
        return $this->findAll(['is_optional' => 0, 'is_active' => 1], 'name ASC');
    }
    
    /**
     * Get all optional fee items
     */
    public function getOptional() {
        return $this->findAll(['is_optional' => 1, 'is_active' => 1], 'name ASC');
    }
    
    /**
     * Get fee item with its group
     */
    public function getWithGroup($itemId) {
        $sql = "SELECT fi.*, fg.name as group_name
                FROM {$this->table} fi
                JOIN fee_groups fg ON fi.group_id = fg.id
                WHERE fi.id = ?";
        return $this->queryOne($sql, [$itemId]);
    }
    
    /**
     * Get all fee items with their groups
     */
    public function getAllWithGroups() {
        $sql = "SELECT fi.*, fg.name as group_name
                FROM {$this->table} fi
                JOIN fee_groups fg ON fi.group_id = fg.id
                WHERE fi.is_active = 1
                ORDER BY fg.display_order ASC, fi.name ASC";
        return $this->query($sql);
    }
    
    /**
     * Get fee items by frequency
     */
    public function getByFrequency($frequency) {
        return $this->findAll(['frequency' => $frequency, 'is_active' => 1], 'name ASC');
    }
}
