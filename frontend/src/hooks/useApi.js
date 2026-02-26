import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { cachedFetch, clearCache, CACHE_DURATIONS, staleWhileRevalidate } from '../utils/apiCache';

/**
 * Optimized API Hook with caching and deduplication
 * Reduces unnecessary network requests and improves perceived performance
 */
export function useApi(endpoint, options = {}) {
  const {
    params = {},
    cacheDuration = CACHE_DURATIONS.medium,
    enabled = true,
    onSuccess,
    onError,
    staleWhileRevalidateEnabled = false,
    initialData = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const mountedRef = useRef(true);

  const url = `${API_BASE_URL}/${endpoint}`;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const fetchFn = async () => {
      const response = await axios.get(url, { params });
      return response.data;
    };

    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (staleWhileRevalidateEnabled) {
        const { data: fetchedData, isStale: stale } = await staleWhileRevalidate(
          fetchFn, url, params, cacheDuration
        );
        result = fetchedData;
        if (mountedRef.current) {
          setIsStale(stale);
        }
      } else {
        result = await cachedFetch(fetchFn, url, params, cacheDuration);
      }

      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.error || err.message);
        onError?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, JSON.stringify(params), enabled, cacheDuration, staleWhileRevalidateEnabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    clearCache(url);
    return fetchData();
  }, [url, fetchData]);

  const mutate = useCallback((newData) => {
    setData(newData);
  }, []);

  return { data, loading, error, refetch, mutate, isStale };
}

/**
 * Hook for POST/PUT/DELETE mutations
 */
export function useMutation(endpoint, options = {}) {
  const { 
    method = 'POST',
    onSuccess,
    onError,
    invalidateCache = []
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const url = `${API_BASE_URL}/${endpoint}`;

  const mutate = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        method,
        url,
        data
      });

      // Invalidate related caches
      invalidateCache.forEach(pattern => clearCache(pattern));

      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method, invalidateCache]);

  return { mutate, loading, error };
}

/**
 * Hook for fetching paginated data
 */
export function usePaginatedApi(endpoint, options = {}) {
  const {
    initialPage = 1,
    perPage = 20,
    params = {},
    cacheDuration = CACHE_DURATIONS.short
  } = options;

  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState([]);

  const { data, loading, error, refetch } = useApi(endpoint, {
    params: { ...params, page, per_page: perPage },
    cacheDuration,
    onSuccess: (result) => {
      if (result?.data) {
        if (page === 1) {
          setAllData(result.data);
        } else {
          setAllData(prev => [...prev, ...result.data]);
        }
      }
    }
  });

  const loadMore = useCallback(() => {
    if (data?.pagination?.has_more && !loading) {
      setPage(p => p + 1);
    }
  }, [data?.pagination?.has_more, loading]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    pagination: data?.pagination,
    loading,
    error,
    loadMore,
    reset,
    hasMore: data?.pagination?.has_more ?? false
  };
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 100, enabled = true } = options;
  const observerRef = useRef(null);

  const lastElementRef = useCallback((node) => {
    if (!enabled) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    }, { rootMargin: `${threshold}px` });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [callback, threshold, enabled]);

  return lastElementRef;
}

export default useApi;
