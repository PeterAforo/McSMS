<?php
/**
 * Parent Model
 * Handles parent data operations
 */

class ParentModel extends Model {
    protected $table = 'parents';
    
    /**
     * Get parent by user ID
     * @param int $userId
     * @return array|false
     */
    public function getByUserId($userId) {
        $sql = "SELECT p.*, u.name, u.email, u.phone, u.status
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = ?";
        return $this->queryOne($sql, [$userId]);
    }
    
    /**
     * Get parent with children
     * @param int $parentId
     * @return array
     */
    public function getWithChildren($parentId) {
        $sql = "SELECT p.*, u.name, u.email, u.phone,
                (SELECT COUNT(*) FROM children WHERE parent_id = p.id) as children_count
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?";
        return $this->queryOne($sql, [$parentId]);
    }
    
    /**
     * Get parent's children
     * @param int $parentId
     * @return array
     */
    public function getChildren($parentId) {
        $sql = "SELECT c.*, 
                (SELECT status FROM admissions WHERE child_id = c.id ORDER BY id DESC LIMIT 1) as admission_status,
                (SELECT id FROM students WHERE child_id = c.id LIMIT 1) as student_id,
                (SELECT student_id FROM students WHERE child_id = c.id LIMIT 1) as student_number
                FROM children c
                WHERE c.parent_id = ?
                ORDER BY c.created_at DESC";
        return $this->query($sql, [$parentId]);
    }
}
