<?php
/**
 * Base Model Class
 * All models extend this class
 */

abstract class Model {
    protected $db;
    protected $table;
    
    public function __construct() {
        $this->db = DB::getInstance()->getConnection();
    }
    
    /**
     * Find record by ID
     * @param int $id
     * @return array|false
     */
    public function findById($id) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Get all records
     * @param array $conditions WHERE conditions
     * @param string $orderBy ORDER BY clause
     * @return array
     */
    public function findAll($conditions = [], $orderBy = 'id DESC') {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "{$key} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }
        
        $sql .= " ORDER BY {$orderBy}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Insert new record
     * @param array $data
     * @return int Last insert ID
     */
    public function insert($data) {
        $fields = array_keys($data);
        $values = array_values($data);
        $placeholders = array_fill(0, count($fields), '?');
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") 
                VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Update record
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            $fields[] = "{$key} = ?";
            $values[] = $value;
        }
        
        $values[] = $id;
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    /**
     * Delete record
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Execute custom query
     * @param string $sql
     * @param array $params
     * @return array
     */
    protected function query($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Execute custom query (single row)
     * @param string $sql
     * @param array $params
     * @return array|false
     */
    protected function queryOne($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }
}
