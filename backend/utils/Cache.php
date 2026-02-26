<?php
/**
 * Simple File-Based Cache System
 * Provides caching for database queries and API responses
 */

class Cache {
    private static $cacheDir = null;
    private static $defaultTTL = 300; // 5 minutes default
    
    /**
     * Initialize cache directory
     */
    private static function init() {
        if (self::$cacheDir === null) {
            self::$cacheDir = __DIR__ . '/../cache';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        }
    }
    
    /**
     * Generate cache key from query and params
     */
    public static function key($prefix, $data = []) {
        $hash = md5($prefix . serialize($data));
        return $prefix . '_' . $hash;
    }
    
    /**
     * Get cached value
     * @param string $key Cache key
     * @return mixed|null Cached value or null if not found/expired
     */
    public static function get($key) {
        self::init();
        $file = self::$cacheDir . '/' . $key . '.cache';
        
        if (!file_exists($file)) {
            return null;
        }
        
        $content = file_get_contents($file);
        $data = unserialize($content);
        
        if ($data === false || !isset($data['expires']) || !isset($data['value'])) {
            return null;
        }
        
        // Check if expired
        if ($data['expires'] < time()) {
            unlink($file);
            return null;
        }
        
        return $data['value'];
    }
    
    /**
     * Set cached value
     * @param string $key Cache key
     * @param mixed $value Value to cache
     * @param int $ttl Time to live in seconds
     */
    public static function set($key, $value, $ttl = null) {
        self::init();
        $ttl = $ttl ?? self::$defaultTTL;
        
        $data = [
            'expires' => time() + $ttl,
            'value' => $value,
            'created' => time()
        ];
        
        $file = self::$cacheDir . '/' . $key . '.cache';
        file_put_contents($file, serialize($data), LOCK_EX);
    }
    
    /**
     * Delete cached value
     */
    public static function delete($key) {
        self::init();
        $file = self::$cacheDir . '/' . $key . '.cache';
        if (file_exists($file)) {
            unlink($file);
        }
    }
    
    /**
     * Clear all cache or by prefix
     */
    public static function clear($prefix = null) {
        self::init();
        $files = glob(self::$cacheDir . '/*.cache');
        
        foreach ($files as $file) {
            if ($prefix === null || strpos(basename($file), $prefix) === 0) {
                unlink($file);
            }
        }
    }
    
    /**
     * Clear expired cache entries
     */
    public static function clearExpired() {
        self::init();
        $files = glob(self::$cacheDir . '/*.cache');
        $cleared = 0;
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            $data = unserialize($content);
            
            if ($data === false || !isset($data['expires']) || $data['expires'] < time()) {
                unlink($file);
                $cleared++;
            }
        }
        
        return $cleared;
    }
    
    /**
     * Remember - get from cache or execute callback and cache result
     * @param string $key Cache key
     * @param callable $callback Function to execute if cache miss
     * @param int $ttl Time to live in seconds
     * @return mixed Cached or fresh value
     */
    public static function remember($key, $callback, $ttl = null) {
        $cached = self::get($key);
        
        if ($cached !== null) {
            return $cached;
        }
        
        $value = $callback();
        self::set($key, $value, $ttl);
        
        return $value;
    }
    
    /**
     * Get cache stats
     */
    public static function stats() {
        self::init();
        $files = glob(self::$cacheDir . '/*.cache');
        $totalSize = 0;
        $expired = 0;
        $valid = 0;
        
        foreach ($files as $file) {
            $totalSize += filesize($file);
            $content = file_get_contents($file);
            $data = unserialize($content);
            
            if ($data && isset($data['expires']) && $data['expires'] >= time()) {
                $valid++;
            } else {
                $expired++;
            }
        }
        
        return [
            'total_entries' => count($files),
            'valid_entries' => $valid,
            'expired_entries' => $expired,
            'total_size_kb' => round($totalSize / 1024, 2)
        ];
    }
}
