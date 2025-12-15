<?php
/**
 * Admission Model
 * Handles admission application operations
 */

class Admission extends Model {
    protected $table = 'admissions';
    
    /**
     * Get admission by child ID
     */
    public function getByChild($childId) {
        $sql = "SELECT * FROM {$this->table} WHERE child_id = ? ORDER BY id DESC LIMIT 1";
        return $this->queryOne($sql, [$childId]);
    }
    
    /**
     * Get applications by parent ID
     */
    public function getByParent($parentId) {
        $sql = "SELECT a.*, c.full_name as child_name, c.gender, c.date_of_birth,
                cl.class_name, cl.level
                FROM {$this->table} a
                JOIN children c ON a.child_id = c.id
                LEFT JOIN classes cl ON a.preferred_class_id = cl.id
                WHERE c.parent_id = ?
                ORDER BY a.created_at DESC";
        return $this->query($sql, [$parentId]);
    }
    
    /**
     * Get all pending applications
     */
    public function getAllPending() {
        $sql = "SELECT a.*, c.full_name as child_name, c.gender, c.date_of_birth,
                cl.class_name, p.id as parent_id, u.name as parent_name, u.email as parent_email
                FROM {$this->table} a
                JOIN children c ON a.child_id = c.id
                JOIN parents p ON c.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                LEFT JOIN classes cl ON a.preferred_class_id = cl.id
                WHERE a.status = 'pending'
                ORDER BY a.created_at ASC";
        return $this->query($sql);
    }
    
    /**
     * Update application status
     */
    public function updateStatus($id, $status, $remarks = null, $processedBy = null) {
        $data = [
            'status' => $status,
            'remarks' => $remarks,
            'processed_by' => $processedBy
        ];
        return $this->update($id, $data);
    }
}
