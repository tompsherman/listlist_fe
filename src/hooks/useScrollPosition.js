import { useState, useEffect } from 'react';

/**
 * useScrollPosition
 * Returns current scroll Y position, updates on scroll.
 * Use for back-to-top buttons, sticky headers, scroll-triggered animations.
 *
 * @param {Object} options
 * @param {number} options.throttleMs - Throttle updates (default: 100ms)
 *
 * @returns {{ scrollY: number, scrollX: number, isScrollingUp: boolean, isScrollingDown: boolean }}
 *
 * @example
 * const { scrollY, isScrollingDown } = useScrollPosition();
 *
 * // Show back-to-top after scrolling 300px
 * const showBackToTop = scrollY > 300;
 *
 * // Hide header when scrolling down
 * const headerVisible = !isScrollingDown || scrollY < 100;
 */
export default function useScrollPosition(options = {}) {
  const { throttleMs = 100 } = options;

  const [position, setPosition] = useState({
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
    isScrollingUp: false,
    isScrollingDown: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let ticking = false;
    let lastUpdate = Date.now();

    const updatePosition = () => {
      const currentScrollY = window.scrollY;
      const currentScrollX = window.scrollX;

      setPosition({
        scrollY: currentScrollY,
        scrollX: currentScrollX,
        isScrollingUp: currentScrollY < lastScrollY,
        isScrollingDown: currentScrollY > lastScrollY,
      });

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      const now = Date.now();

      if (!ticking && now - lastUpdate >= throttleMs) {
        window.requestAnimationFrame(() => {
          updatePosition();
          lastUpdate = now;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttleMs]);

  return position;
}

/**
 * Smooth scroll to top of page
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
