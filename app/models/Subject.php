<?php
/**
 * Subject Model
 */

class Subject extends Model {
    protected $table = 'subjects';
    
    public function getByLevel($level) {
        return $this->findAll(['level' => $level], 'subject_name ASC');
    }
}
