<?php
/**
 * Homework Model
 */

class Homework extends Model {
    protected $table = 'homework';
    
    public function getByTeacher($teacherId) {
        $sql = "SELECT h.*, c.class_name, s.subject_name,
                (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id) as submission_count
                FROM {$this->table} h
                JOIN classes c ON h.class_id = c.id
                JOIN subjects s ON h.subject_id = s.id
                WHERE h.teacher_id = ?
                ORDER BY h.created_at DESC";
        return $this->query($sql, [$teacherId]);
    }
    
    public function getByClass($classId) {
        $sql = "SELECT h.*, s.subject_name, u.name as teacher_name
                FROM {$this->table} h
                JOIN subjects s ON h.subject_id = s.id
                JOIN users u ON h.teacher_id = u.id
                WHERE h.class_id = ?
                ORDER BY h.due_date DESC";
        return $this->query($sql, [$classId]);
    }
}
