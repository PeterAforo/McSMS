<?php
/**
 * Attendance Model
 */

class Attendance extends Model {
    protected $table = 'attendance';
    
    public function markAttendance($studentId, $date, $status, $markedBy) {
        // Check if attendance already exists
        $existing = $this->queryOne(
            "SELECT * FROM {$this->table} WHERE student_id = ? AND date = ?",
            [$studentId, $date]
        );
        
        if ($existing) {
            return $this->update($existing['id'], [
                'status' => $status,
                'marked_by' => $markedBy
            ]);
        } else {
            return $this->insert([
                'student_id' => $studentId,
                'date' => $date,
                'status' => $status,
                'marked_by' => $markedBy
            ]);
        }
    }
    
    public function getByClassAndDate($classId, $date) {
        $sql = "SELECT a.*, s.id as student_id
                FROM {$this->table} a
                JOIN students s ON a.student_id = s.id
                WHERE s.class_id = ? AND a.date = ?";
        $results = $this->query($sql, [$classId, $date]);
        
        $attendance = [];
        foreach ($results as $row) {
            $attendance[$row['student_id']] = $row['status'];
        }
        return $attendance;
    }
}
