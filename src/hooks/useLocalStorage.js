import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage
 * Persistent state that syncs with localStorage.
 * Same API as useState, but survives page refresh and syncs across tabs.
 *
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // Value persists across page refreshes
 * // Changes sync across browser tabs
 */
export default function useLocalStorage(key, defaultValue) {
  // Initialize from localStorage or default
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Persist to localStorage when value changes
  useEffect(() => {
    try {
      if (value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // localStorage might be full or disabled
    }
  }, [key, value]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      } else if (e.key === key && e.newValue === null) {
        setValue(defaultValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, defaultValue]);

  // Remove value helper
  const removeValue = useCallback(() => {
    setValue(undefined);
    localStorage.removeItem(key);
  }, [key]);

  return [value, setValue, removeValue];
}
