<?php
/**
 * Section Model
 * Handles section data operations
 */

class Section extends Model {
    protected $table = 'sections';
    
    /**
     * Get sections by class
     */
    public function getByClass($classId) {
        return $this->findAll(['class_id' => $classId], 'section_name ASC');
    }
    
    /**
     * Get section with class details
     */
    public function getWithClass($sectionId) {
        $sql = "SELECT s.*, c.class_name, c.level
                FROM {$this->table} s
                JOIN classes c ON s.class_id = c.id
                WHERE s.id = ?";
        return $this->queryOne($sql, [$sectionId]);
    }
    
    /**
     * Get all sections with class details
     */
    public function getAllWithClass() {
        $sql = "SELECT s.*, c.class_name, c.level
                FROM {$this->table} s
                JOIN classes c ON s.class_id = c.id
                ORDER BY c.level ASC, c.class_name ASC, s.section_name ASC";
        return $this->query($sql);
    }
    
    /**
     * Get student count for section
     */
    public function getStudentCount($sectionId) {
        $sql = "SELECT COUNT(*) FROM students WHERE section_id = ? AND status = 'active'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sectionId]);
        return $stmt->fetchColumn();
    }
    
    /**
     * Check if section name exists for a class
     */
    public function sectionExists($classId, $sectionName, $excludeId = null) {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE class_id = ? AND section_name = ?";
        $params = [$classId, $sectionName];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
}
