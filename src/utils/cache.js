/**
 * Simple localStorage cache with TTL
 */

const CACHE_PREFIX = 'listlist_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours - survives cold starts

export function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    
    const { data, expires } = JSON.parse(raw);
    if (expires && Date.now() > expires) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    const expires = ttl ? Date.now() + ttl : null;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expires }));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export function clearCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function clearAllCache() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
