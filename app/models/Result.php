<?php
/**
 * Result Model
 */

class Result extends Model {
    protected $table = 'results';
    
    public function saveResult($studentId, $subjectId, $termId, $caScore, $examScore, $total, $grade) {
        $existing = $this->queryOne(
            "SELECT * FROM {$this->table} WHERE student_id = ? AND subject_id = ? AND term_id = ?",
            [$studentId, $subjectId, $termId]
        );
        
        $data = [
            'ca_score' => $caScore,
            'exam_score' => $examScore,
            'total' => $total,
            'grade' => $grade
        ];
        
        if ($existing) {
            return $this->update($existing['id'], $data);
        } else {
            $data['student_id'] = $studentId;
            $data['subject_id'] = $subjectId;
            $data['term_id'] = $termId;
            return $this->insert($data);
        }
    }
    
    public function getByClassSubjectTerm($classId, $subjectId, $termId) {
        $sql = "SELECT r.*, s.id as student_id
                FROM {$this->table} r
                JOIN students s ON r.student_id = s.id
                WHERE s.class_id = ? AND r.subject_id = ? AND r.term_id = ?";
        $results = $this->query($sql, [$classId, $subjectId, $termId]);
        
        $grades = [];
        foreach ($results as $row) {
            $grades[$row['student_id']] = $row;
        }
        return $grades;
    }
}
