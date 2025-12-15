<?php
/**
 * User Model
 * Handles user data operations
 */

class User extends Model {
    protected $table = 'users';
    
    /**
     * Find user by email
     * @param string $email
     * @return array|false
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = ?";
        return $this->queryOne($sql, [$email]);
    }
    
    /**
     * Find user by ID with role information
     * @param int $id
     * @return array|false
     */
    public function findWithRoles($id) {
        $sql = "SELECT u.*, GROUP_CONCAT(r.role_name) as roles
                FROM {$this->table} u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
                GROUP BY u.id";
        return $this->queryOne($sql, [$id]);
    }
    
    /**
     * Get all users by type
     * @param string $userType
     * @return array
     */
    public function findByType($userType) {
        return $this->findAll(['user_type' => $userType], 'name ASC');
    }
    
    /**
     * Update user status
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateStatus($id, $status) {
        return $this->update($id, ['status' => $status]);
    }
    
    /**
     * Change password
     * @param int $id
     * @param string $newPassword
     * @return bool
     */
    public function changePassword($id, $newPassword) {
        $hashedPassword = Auth::hashPassword($newPassword);
        return $this->update($id, ['password' => $hashedPassword]);
    }
}
