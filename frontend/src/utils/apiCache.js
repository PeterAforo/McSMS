/**
 * API Request Cache & Deduplication
 * Prevents duplicate requests and caches responses
 */

// In-flight request tracking (prevents duplicate simultaneous requests)
const pendingRequests = new Map();

// Response cache with TTL
const responseCache = new Map();

// Default cache durations (in milliseconds)
const CACHE_DURATIONS = {
  short: 30 * 1000,      // 30 seconds - for frequently changing data
  medium: 2 * 60 * 1000, // 2 minutes - for dashboard stats
  long: 5 * 60 * 1000,   // 5 minutes - for relatively static data
  static: 30 * 60 * 1000 // 30 minutes - for rarely changing data (education levels, etc.)
};

/**
 * Generate cache key from request config
 */
const getCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${url}?${sortedParams}`;
};

/**
 * Check if cached response is still valid
 */
const isValidCache = (cacheEntry) => {
  if (!cacheEntry) return false;
  return Date.now() < cacheEntry.expiresAt;
};

/**
 * Get cached response if valid
 */
export const getCached = (url, params = {}) => {
  const key = getCacheKey(url, params);
  const cached = responseCache.get(key);
  
  if (isValidCache(cached)) {
    return cached.data;
  }
  
  // Clean up expired entry
  if (cached) {
    responseCache.delete(key);
  }
  
  return null;
};

/**
 * Set cache entry
 */
export const setCache = (url, params = {}, data, duration = CACHE_DURATIONS.medium) => {
  const key = getCacheKey(url, params);
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + duration,
    cachedAt: Date.now()
  });
};

/**
 * Clear cache by URL pattern
 */
export const clearCache = (urlPattern = null) => {
  if (!urlPattern) {
    responseCache.clear();
    return;
  }
  
  for (const key of responseCache.keys()) {
    if (key.includes(urlPattern)) {
      responseCache.delete(key);
    }
  }
};

/**
 * Deduplicated fetch - prevents duplicate simultaneous requests
 * If a request to the same URL is already in flight, returns that promise
 */
export const deduplicatedFetch = async (fetchFn, url, params = {}) => {
  const key = getCacheKey(url, params);
  
  // Check if request is already in flight
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  // Create new request promise
  const requestPromise = fetchFn()
    .finally(() => {
      // Remove from pending after completion
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, requestPromise);
  return requestPromise;
};

/**
 * Cached fetch with deduplication
 * Combines caching and request deduplication
 */
export const cachedFetch = async (fetchFn, url, params = {}, cacheDuration = CACHE_DURATIONS.medium) => {
  // Check cache first
  const cached = getCached(url, params);
  if (cached) {
    return cached;
  }
  
  // Deduplicated fetch
  const data = await deduplicatedFetch(fetchFn, url, params);
  
  // Cache the response
  if (data) {
    setCache(url, params, data, cacheDuration);
  }
  
  return data;
};

/**
 * Stale-while-revalidate pattern
 * Returns cached data immediately, then fetches fresh data in background
 */
export const staleWhileRevalidate = async (fetchFn, url, params = {}, cacheDuration = CACHE_DURATIONS.medium) => {
  const cached = getCached(url, params);
  
  // Start background refresh
  const refreshPromise = deduplicatedFetch(fetchFn, url, params)
    .then(data => {
      if (data) {
        setCache(url, params, data, cacheDuration);
      }
      return data;
    })
    .catch(err => {
      console.error('Background refresh failed:', err);
      return cached; // Return stale data on error
    });
  
  // Return cached data immediately if available
  if (cached) {
    return { data: cached, isStale: true, refreshPromise };
  }
  
  // Wait for fresh data if no cache
  const freshData = await refreshPromise;
  return { data: freshData, isStale: false, refreshPromise: Promise.resolve(freshData) };
};

/**
 * Batch multiple requests together
 * Useful for dashboard that needs multiple API calls
 */
export const batchRequests = async (requests) => {
  const results = await Promise.allSettled(
    requests.map(({ fetchFn, url, params, cacheDuration }) => 
      cachedFetch(fetchFn, url, params, cacheDuration)
    )
  );
  
  return results.map((result, index) => ({
    url: requests[index].url,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  let validEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;
  
  for (const [key, entry] of responseCache.entries()) {
    if (isValidCache(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
    totalSize += JSON.stringify(entry.data).length;
  }
  
  return {
    totalEntries: responseCache.size,
    validEntries,
    expiredEntries,
    pendingRequests: pendingRequests.size,
    approximateSizeKB: Math.round(totalSize / 1024)
  };
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  let cleared = 0;
  for (const [key, entry] of responseCache.entries()) {
    if (!isValidCache(entry)) {
      responseCache.delete(key);
      cleared++;
    }
  }
  return cleared;
};

// Auto-clear expired entries every 5 minutes
setInterval(clearExpiredCache, 5 * 60 * 1000);

export { CACHE_DURATIONS };
