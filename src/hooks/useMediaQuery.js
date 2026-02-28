import { useState, useEffect } from 'react';

/**
 * useMediaQuery
 * Returns a boolean for any CSS media query.
 * Updates automatically when the viewport changes.
 *
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 *
 * // Use the CSS variable breakpoints from variables.css:
 * const isMobile = useMediaQuery('(max-width: 480px)');
 * const isTablet = useMediaQuery('(max-width: 768px)');
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    // SSR safety: default to false if window is undefined
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}
