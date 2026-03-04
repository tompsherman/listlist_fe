/**
 * Simple localStorage cache with TTL
 */

const CACHE_PREFIX = 'listlist_';
const DEFAULT_TTL = 72 * 60 * 60 * 1000; // 72 hours (3 days) - survives cold starts

export function getCached(key) {
  try {
    const fullKey = CACHE_PREFIX + key;
    const raw = localStorage.getItem(fullKey);
    console.log('[cache] getCached', fullKey, raw ? 'found' : 'miss');
    if (!raw) return null;
    
    const { data, expires } = JSON.parse(raw);
    if (expires && Date.now() > expires) {
      console.log('[cache] expired, removing', fullKey);
      localStorage.removeItem(fullKey);
      return null;
    }
    console.log('[cache] returning cached data, items:', Array.isArray(data) ? data.length : 'object');
    return data;
  } catch (e) {
    console.error('[cache] getCached error:', e);
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
