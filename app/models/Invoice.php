<?php
class Invoice extends Model {
    protected $table = 'invoices';
    
    public function getAllWithDetails() {
        $sql = "SELECT i.*, s.student_id as student_number, c.full_name as student_name,
                cl.class_name, t.term_name
                FROM {$this->table} i
                JOIN students s ON i.student_id = s.id
                JOIN children c ON s.child_id = c.id
                JOIN classes cl ON s.class_id = cl.id
                JOIN academic_terms t ON i.term_id = t.id
                ORDER BY i.created_at DESC";
        return $this->query($sql);
    }
    
    public function getWithDetails($id) {
        $sql = "SELECT i.*, s.student_id as student_number, ch.full_name as student_name,
                cl.class_name, t.term_name, p.id as parent_id, u.name as parent_name
                FROM {$this->table} i
                JOIN students s ON i.student_id = s.id
                JOIN children ch ON s.child_id = ch.id
                JOIN classes cl ON s.class_id = cl.id
                JOIN academic_terms t ON i.term_id = t.id
                JOIN parents p ON ch.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE i.id = ?";
        $invoice = $this->queryOne($sql, [$id]);
        
        if ($invoice) {
            $invoice['items'] = $this->getItems($id);
            $invoice['payments'] = $this->getPayments($id);
        }
        
        return $invoice;
    }
    
    private function getItems($invoiceId) {
        $sql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
        return $this->query($sql, [$invoiceId]);
    }
    
    private function getPayments($invoiceId) {
        $sql = "SELECT p.*, u.name as received_by_name
                FROM payments p
                LEFT JOIN users u ON p.received_by = u.id
                WHERE p.invoice_id = ?
                ORDER BY p.created_at DESC";
        return $this->query($sql, [$invoiceId]);
    }
}
