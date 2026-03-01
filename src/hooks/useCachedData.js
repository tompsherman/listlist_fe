/**
 * useCachedData Hook
 * 
 * Handles cold-start delays gracefully:
 * - Shows cached data immediately if available
 * - Shows countdown timer when no cache (so user knows it's not hung)
 * - Queues optimistic updates that merge when fresh data arrives
 * 
 * Usage:
 *   const { data, loading, countdown, isStale, applyChange } = useCachedData({
 *     key: 'pantry_podId',
 *     fetchFn: async () => await api.getItems(),
 *     coldStartMs: 30000,
 *   });
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCached, setCache } from '../utils/cache';

const DEFAULT_COLD_START_MS = 30000; // 30 seconds for Render cold start
const COUNTDOWN_INTERVAL_MS = 1000;

export function useCachedData({
  key,
  fetchFn,
  coldStartMs = DEFAULT_COLD_START_MS,
  ttl = 5 * 60 * 1000, // 5 min cache TTL
  enabled = true,
  mergeStrategy = 'replace', // 'replace' | 'merge'
  getId = (item) => item._id || item.id,
}) {
  // Core state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  // Queue for optimistic updates made while fetching
  const pendingChanges = useRef([]);
  const countdownRef = useRef(null);
  const fetchStartTime = useRef(null);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    const seconds = Math.ceil(coldStartMs / 1000);
    setCountdown(seconds);
    fetchStartTime.current = Date.now();

    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - fetchStartTime.current;
      const remaining = Math.max(0, Math.ceil((coldStartMs - elapsed) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, COUNTDOWN_INTERVAL_MS);
  }, [coldStartMs]);

  // Stop countdown timer
  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Apply pending changes to fresh data
  const applyPendingChanges = useCallback((freshData) => {
    if (!Array.isArray(freshData) || pendingChanges.current.length === 0) {
      return freshData;
    }

    let result = [...freshData];

    for (const change of pendingChanges.current) {
      switch (change.type) {
        case 'add':
          // Add if not already in fresh data
          if (!result.find(item => getId(item) === getId(change.item))) {
            result.push(change.item);
          }
          break;

        case 'update':
          result = result.map(item => 
            getId(item) === getId(change.item) ? { ...item, ...change.item } : item
          );
          break;

        case 'remove':
          result = result.filter(item => getId(item) !== change.id);
          break;

        case 'custom':
          if (change.apply) {
            result = change.apply(result);
          }
          break;

        default:
          break;
      }
    }

    // Clear pending changes after applying
    pendingChanges.current = [];
    return result;
  }, [getId]);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!enabled || !key) return;

    setError(null);
    
    // Check cache first
    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setIsStale(true);
      setLoading(false);
      // Don't show countdown if we have cache
    } else {
      // No cache - show countdown
      setLoading(true);
      startCountdown();
    }

    try {
      const freshData = await fetchFn();
      
      // Apply any changes made while we were fetching
      const mergedData = applyPendingChanges(freshData);
      
      setData(mergedData);
      setCache(key, mergedData, ttl);
      setIsStale(false);
      setError(null);
    } catch (err) {
      console.error('useCachedData fetch error:', err);
      setError(err.message || 'Failed to load data');
      // Keep stale data if we have it
      if (!data) {
        setData(null);
      }
    } finally {
      setLoading(false);
      stopCountdown();
    }
  }, [key, fetchFn, enabled, ttl, startCountdown, stopCountdown, applyPendingChanges, data]);

  // Queue an optimistic change
  const applyChange = useCallback((changeType, payload) => {
    // Apply immediately to current data
    setData(current => {
      if (!Array.isArray(current)) return current;

      switch (changeType) {
        case 'add':
          return [...current, payload];

        case 'update':
          return current.map(item => 
            getId(item) === getId(payload) ? { ...item, ...payload } : item
          );

        case 'remove':
          return current.filter(item => getId(item) !== payload);

        case 'custom':
          return payload.apply ? payload.apply(current) : current;

        default:
          return current;
      }
    });

    // Also update cache immediately
    setData(current => {
      if (current) {
        setCache(key, current, ttl);
      }
      return current;
    });

    // Queue for merge with fresh data (if still fetching)
    if (loading) {
      pendingChanges.current.push({ type: changeType, ...payload, item: payload, id: payload });
    }
  }, [getId, key, ttl, loading]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Clear cache and refetch
  const clearAndRefetch = useCallback(() => {
    setData(null);
    setIsStale(false);
    localStorage.removeItem(`listlist_${key}`);
    fetchData();
  }, [key, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    return () => {
      stopCountdown();
    };
  }, [key, enabled]); // Only refetch if key or enabled changes

  return {
    data,
    loading,
    error,
    isStale,
    countdown,
    applyChange,
    refetch,
    clearAndRefetch,
    setData, // For direct manipulation if needed
  };
}

export default useCachedData;
