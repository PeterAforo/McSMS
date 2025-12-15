<?php
class FeeType extends Model {
    protected $table = 'fee_types';
    
    public function getAllWithClass() {
        $sql = "SELECT f.*, c.class_name FROM {$this->table} f
                JOIN classes c ON f.class_id = c.id
                ORDER BY c.class_name, f.fee_name";
        return $this->query($sql);
    }
    
    public function getByClass($classId) {
        return $this->findAll(['class_id' => $classId]);
    }
}
