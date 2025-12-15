<?php
/**
 * Setting Model
 * Handles system settings
 */

class Setting extends Model {
    protected $table = 'settings';
    
    /**
     * Get all settings as key-value array
     */
    public function getAll() {
        $settings = $this->findAll();
        $result = [];
        
        foreach ($settings as $setting) {
            $result[$setting['key_name']] = $setting['value'];
        }
        
        return $result;
    }
    
    /**
     * Get setting by key
     */
    public function getByKey($key) {
        $sql = "SELECT value FROM {$this->table} WHERE key_name = ?";
        $result = $this->queryOne($sql, [$key]);
        return $result ? $result['value'] : null;
    }
    
    /**
     * Update or create setting
     */
    public function set($key, $value) {
        $existing = $this->getByKey($key);
        
        if ($existing !== null) {
            $sql = "UPDATE {$this->table} SET value = ? WHERE key_name = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$value, $key]);
        } else {
            return $this->insert([
                'key_name' => $key,
                'value' => $value
            ]);
        }
    }
}
