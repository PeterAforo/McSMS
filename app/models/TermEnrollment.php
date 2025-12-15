<?php
class TermEnrollment extends Model {
    protected $table = 'term_enrollments';
    
    /**
     * Check if student is enrolled for a term
     */
    public function isEnrolled($studentId, $termId) {
        $sql = "SELECT * FROM {$this->table} 
                WHERE student_id = ? AND term_id = ? AND enrollment_status = 'enrolled'";
        return $this->queryOne($sql, [$studentId, $termId]) !== null;
    }
    
    /**
     * Get enrollment with details
     */
    public function getWithDetails($studentId, $termId) {
        $sql = "SELECT te.*, i.total_amount, i.amount_paid, i.balance, i.status as invoice_status
                FROM {$this->table} te
                LEFT JOIN invoices i ON te.invoice_id = i.id
                WHERE te.student_id = ? AND te.term_id = ?";
        return $this->queryOne($sql, [$studentId, $termId]);
    }
    
    /**
     * Get all enrollments for a student
     */
    public function getByStudent($studentId) {
        $sql = "SELECT te.*, t.term_name, i.total_amount, i.balance, i.workflow_status
                FROM {$this->table} te
                JOIN academic_terms t ON te.term_id = t.id
                LEFT JOIN invoices i ON te.invoice_id = i.id
                WHERE te.student_id = ?
                ORDER BY te.created_at DESC";
        return $this->query($sql, [$studentId]);
    }
    
    /**
     * Create enrollment
     */
    public function createEnrollment($studentId, $termId, $invoiceId = null) {
        return $this->insert([
            'student_id' => $studentId,
            'term_id' => $termId,
            'invoice_id' => $invoiceId,
            'enrollment_status' => 'pending'
        ]);
    }
    
    /**
     * Update enrollment status
     */
    public function updateStatus($id, $status) {
        $data = ['enrollment_status' => $status];
        if ($status === 'enrolled') {
            $data['enrolled_at'] = date('Y-m-d H:i:s');
        }
        return $this->update($id, $data);
    }
}
