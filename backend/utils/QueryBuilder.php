<?php
/**
 * Query Builder Utility
 * Helps build optimized SQL queries with proper pagination and filtering
 */

class QueryBuilder {
    private $pdo;
    private $table;
    private $select = '*';
    private $joins = [];
    private $where = [];
    private $params = [];
    private $orderBy = [];
    private $groupBy = [];
    private $limit = null;
    private $offset = null;
    
    public function __construct($pdo, $table) {
        $this->pdo = $pdo;
        $this->table = $table;
    }
    
    /**
     * Set columns to select
     */
    public function select($columns) {
        $this->select = is_array($columns) ? implode(', ', $columns) : $columns;
        return $this;
    }
    
    /**
     * Add JOIN clause
     */
    public function join($table, $condition, $type = 'LEFT') {
        $this->joins[] = "$type JOIN $table ON $condition";
        return $this;
    }
    
    /**
     * Add WHERE condition
     */
    public function where($column, $operator, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }
        
        $placeholder = ':w' . count($this->params);
        $this->where[] = "$column $operator $placeholder";
        $this->params[$placeholder] = $value;
        return $this;
    }
    
    /**
     * Add WHERE IN condition
     */
    public function whereIn($column, $values) {
        if (empty($values)) {
            $this->where[] = '1=0'; // No results
            return $this;
        }
        
        $placeholders = [];
        foreach ($values as $i => $value) {
            $placeholder = ':in' . count($this->params);
            $placeholders[] = $placeholder;
            $this->params[$placeholder] = $value;
        }
        
        $this->where[] = "$column IN (" . implode(', ', $placeholders) . ")";
        return $this;
    }
    
    /**
     * Add WHERE LIKE condition for search
     */
    public function whereLike($columns, $search) {
        if (empty($search)) return $this;
        
        $conditions = [];
        $columns = is_array($columns) ? $columns : [$columns];
        
        foreach ($columns as $column) {
            $placeholder = ':like' . count($this->params);
            $conditions[] = "$column LIKE $placeholder";
            $this->params[$placeholder] = "%$search%";
        }
        
        $this->where[] = '(' . implode(' OR ', $conditions) . ')';
        return $this;
    }
    
    /**
     * Add WHERE between dates
     */
    public function whereBetween($column, $start, $end) {
        $startPlaceholder = ':start' . count($this->params);
        $endPlaceholder = ':end' . count($this->params);
        
        $this->where[] = "$column BETWEEN $startPlaceholder AND $endPlaceholder";
        $this->params[$startPlaceholder] = $start;
        $this->params[$endPlaceholder] = $end;
        return $this;
    }
    
    /**
     * Add raw WHERE condition
     */
    public function whereRaw($condition, $params = []) {
        $this->where[] = $condition;
        $this->params = array_merge($this->params, $params);
        return $this;
    }
    
    /**
     * Add ORDER BY clause
     */
    public function orderBy($column, $direction = 'ASC') {
        $this->orderBy[] = "$column $direction";
        return $this;
    }
    
    /**
     * Add GROUP BY clause
     */
    public function groupBy($columns) {
        $this->groupBy = is_array($columns) ? $columns : [$columns];
        return $this;
    }
    
    /**
     * Set LIMIT and OFFSET for pagination
     */
    public function paginate($page = 1, $perPage = 20) {
        $page = max(1, (int)$page);
        $perPage = min(100, max(1, (int)$perPage)); // Cap at 100
        
        $this->limit = $perPage;
        $this->offset = ($page - 1) * $perPage;
        return $this;
    }
    
    /**
     * Set raw LIMIT
     */
    public function limit($limit) {
        $this->limit = (int)$limit;
        return $this;
    }
    
    /**
     * Build the SQL query
     */
    private function buildQuery($countOnly = false) {
        $sql = $countOnly 
            ? "SELECT COUNT(*) as total FROM {$this->table}"
            : "SELECT {$this->select} FROM {$this->table}";
        
        // Add JOINs
        if (!empty($this->joins)) {
            $sql .= ' ' . implode(' ', $this->joins);
        }
        
        // Add WHERE
        if (!empty($this->where)) {
            $sql .= ' WHERE ' . implode(' AND ', $this->where);
        }
        
        // Add GROUP BY
        if (!empty($this->groupBy) && !$countOnly) {
            $sql .= ' GROUP BY ' . implode(', ', $this->groupBy);
        }
        
        // Add ORDER BY
        if (!empty($this->orderBy) && !$countOnly) {
            $sql .= ' ORDER BY ' . implode(', ', $this->orderBy);
        }
        
        // Add LIMIT and OFFSET
        if ($this->limit !== null && !$countOnly) {
            $sql .= " LIMIT {$this->limit}";
            if ($this->offset !== null) {
                $sql .= " OFFSET {$this->offset}";
            }
        }
        
        return $sql;
    }
    
    /**
     * Execute query and get all results
     */
    public function get() {
        $sql = $this->buildQuery();
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Execute query and get first result
     */
    public function first() {
        $this->limit = 1;
        $results = $this->get();
        return $results[0] ?? null;
    }
    
    /**
     * Get count of results
     */
    public function count() {
        $sql = $this->buildQuery(true);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->params);
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }
    
    /**
     * Get paginated results with metadata
     */
    public function getPaginated($page = 1, $perPage = 20) {
        // Get total count first
        $total = $this->count();
        
        // Then get paginated results
        $this->paginate($page, $perPage);
        $data = $this->get();
        
        $totalPages = ceil($total / $perPage);
        
        return [
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => (int)$page,
                'per_page' => (int)$perPage,
                'total_pages' => $totalPages,
                'has_more' => $page < $totalPages
            ]
        ];
    }
    
    /**
     * Check if any results exist
     */
    public function exists() {
        $this->limit = 1;
        $sql = "SELECT 1 FROM {$this->table}";
        
        if (!empty($this->joins)) {
            $sql .= ' ' . implode(' ', $this->joins);
        }
        
        if (!empty($this->where)) {
            $sql .= ' WHERE ' . implode(' AND ', $this->where);
        }
        
        $sql .= ' LIMIT 1';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->params);
        return $stmt->fetch() !== false;
    }
    
    /**
     * Get the built SQL for debugging
     */
    public function toSql() {
        return [
            'sql' => $this->buildQuery(),
            'params' => $this->params
        ];
    }
}

/**
 * Helper function to create QueryBuilder instance
 */
function query($pdo, $table) {
    return new QueryBuilder($pdo, $table);
}
