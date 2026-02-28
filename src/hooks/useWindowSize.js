import { useState, useEffect } from 'react';

/**
 * useWindowSize
 * Returns live window width and height, updates on resize.
 * Use for calculations that need actual pixel values, not just breakpoints.
 *
 * @param {Object} options
 * @param {number} options.debounceMs - Debounce resize updates (default: 100)
 *
 * @returns {{ width: number, height: number }}
 *
 * @example
 * const { width, height } = useWindowSize();
 *
 * // Calculate responsive canvas size
 * const canvasWidth = Math.min(width - 40, 800);
 *
 * @example
 * // Combine with useMediaQuery for hybrid approach
 * const { width } = useWindowSize();
 * const isMobile = useMediaQuery('(max-width: 768px)');
 *
 * // Use isMobile for layout decisions, width for precise calculations
 */
export default function useWindowSize(options = {}) {
  const { debounceMs = 100 } = options;

  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    // Set initial size
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return size;
}
