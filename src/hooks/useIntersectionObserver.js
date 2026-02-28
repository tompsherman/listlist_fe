import { useState, useEffect } from 'react';

/**
 * useIntersectionObserver
 * Fires when an element enters or leaves the viewport.
 * Powers lazy loading, infinite scroll, scroll-triggered animations, "mark as read".
 *
 * @param {React.RefObject} ref - Ref to the element to observe
 * @param {Object} options
 * @param {string} options.rootMargin - Margin around root (default: '0px')
 * @param {number|number[]} options.threshold - Visibility threshold 0-1 (default: 0)
 * @param {boolean} options.triggerOnce - Only trigger once, then disconnect (default: false)
 * @param {boolean} options.enabled - Whether observer is active (default: true)
 *
 * @returns {{ isIntersecting: boolean, entry: IntersectionObserverEntry | null }}
 *
 * @example
 * // Lazy load image when visible
 * const imageRef = useRef(null);
 * const { isIntersecting } = useIntersectionObserver(imageRef, { triggerOnce: true });
 *
 * return (
 *   <div ref={imageRef}>
 *     {isIntersecting && <img src={src} />}
 *   </div>
 * );
 *
 * @example
 * // Infinite scroll - load more when sentinel is visible
 * const sentinelRef = useRef(null);
 * const { isIntersecting } = useIntersectionObserver(sentinelRef, {
 *   rootMargin: '100px', // Trigger 100px before visible
 * });
 *
 * useEffect(() => {
 *   if (isIntersecting && hasMore) loadMore();
 * }, [isIntersecting, hasMore]);
 */
export default function useIntersectionObserver(ref, options = {}) {
  const {
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
    enabled = true,
  } = options;

  const [state, setState] = useState({
    isIntersecting: false,
    entry: null,
  });

  useEffect(() => {
    if (!enabled || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const element = ref.current;
    let hasTriggered = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setState({
          isIntersecting: entry.isIntersecting,
          entry,
        });

        if (triggerOnce && entry.isIntersecting && !hasTriggered) {
          hasTriggered = true;
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rootMargin, threshold, triggerOnce, enabled]);

  return state;
}
