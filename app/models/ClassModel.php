<?php
/**
 * Class Model
 * Handles class data operations
 */

class ClassModel extends Model {
    protected $table = 'classes';
    
    /**
     * Get classes by level
     */
    public function getByLevel($level) {
        return $this->findAll(['level' => $level], 'class_name ASC');
    }
    
    /**
     * Get class with sections
     */
    public function getWithSections($classId) {
        $class = $this->findById($classId);
        
        if ($class) {
            $sql = "SELECT * FROM sections WHERE class_id = ? ORDER BY section_name ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$classId]);
            $class['sections'] = $stmt->fetchAll();
        }
        
        return $class;
    }
    
    /**
     * Get student count for class
     */
    public function getStudentCount($classId) {
        $sql = "SELECT COUNT(*) FROM students WHERE class_id = ? AND status = 'active'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$classId]);
        return $stmt->fetchColumn();
    }
}
