<?php
/**
 * Student Model
 * Handles student data operations
 */

class Student extends Model {
    protected $table = 'students';
    
    /**
     * Get student with full details
     */
    public function getWithDetails($studentId) {
        $sql = "SELECT s.*, c.full_name, c.gender, c.date_of_birth, c.photo,
                cl.class_name, cl.level, sec.section_name,
                p.id as parent_id, u.name as parent_name, u.email as parent_email, u.phone as parent_phone
                FROM {$this->table} s
                JOIN children c ON s.child_id = c.id
                JOIN classes cl ON s.class_id = cl.id
                JOIN sections sec ON s.section_id = sec.id
                JOIN parents p ON c.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE s.id = ?";
        return $this->queryOne($sql, [$studentId]);
    }
    
    /**
     * Get students by class
     */
    public function getByClass($classId, $sectionId = null) {
        $sql = "SELECT s.*, c.full_name, c.gender, c.date_of_birth
                FROM {$this->table} s
                JOIN children c ON s.child_id = c.id
                WHERE s.class_id = ? AND s.status = 'active'";
        
        $params = [$classId];
        
        if ($sectionId) {
            $sql .= " AND s.section_id = ?";
            $params[] = $sectionId;
        }
        
        $sql .= " ORDER BY c.full_name ASC";
        
        return $this->query($sql, $params);
    }
    
    /**
     * Get active students count
     */
    public function getActiveCount() {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE status = 'active'";
        $stmt = $this->db->query($sql);
        return $stmt->fetchColumn();
    }
}
