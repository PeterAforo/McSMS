<?php
/**
 * Child Model
 * Handles child data operations
 */

class ChildModel extends Model {
    protected $table = 'children';
    
    /**
     * Get child with parent info
     */
    public function getWithParent($childId) {
        $sql = "SELECT c.*, p.address, p.occupation, u.name as parent_name, u.email as parent_email, u.phone as parent_phone
                FROM {$this->table} c
                JOIN parents p ON c.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE c.id = ?";
        return $this->queryOne($sql, [$childId]);
    }
    
    /**
     * Get child with admission status
     */
    public function getWithAdmissionStatus($childId) {
        $sql = "SELECT c.*, 
                (SELECT status FROM admissions WHERE child_id = c.id ORDER BY id DESC LIMIT 1) as admission_status,
                (SELECT student_id FROM students WHERE child_id = c.id LIMIT 1) as student_number
                FROM {$this->table} c
                WHERE c.id = ?";
        return $this->queryOne($sql, [$childId]);
    }
}
