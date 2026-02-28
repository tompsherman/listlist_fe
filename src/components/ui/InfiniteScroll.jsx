/**
 * InfiniteScroll Component
 * Triggers load more when sentinel enters viewport.
 * Alternative to Pagination for continuous loading.
 */

import { useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks';
import './InfiniteScroll.css';

export default function InfiniteScroll({
  children,
  onLoadMore,
  hasMore = true,
  loading = false,
  rootMargin = '200px',
  loader = null,
  endMessage = null,
  className = '',
}) {
  const sentinelRef = useRef(null);
  const { isIntersecting } = useIntersectionObserver(sentinelRef, {
    rootMargin,
    enabled: hasMore && !loading,
  });

  // Trigger load more when sentinel is visible
  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore?.();
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  // Default loader
  const defaultLoader = (
    <div className="infinite-scroll-loader">
      <span className="infinite-scroll-spinner" />
      <span>Loading more...</span>
    </div>
  );

  // Default end message
  const defaultEndMessage = (
    <div className="infinite-scroll-end">
      No more items
    </div>
  );

  return (
    <div className={`infinite-scroll ${className}`}>
      {children}

      {/* Sentinel element triggers load */}
      <div ref={sentinelRef} className="infinite-scroll-sentinel" />

      {/* Loading state */}
      {loading && (loader || defaultLoader)}

      {/* End message */}
      {!hasMore && !loading && (endMessage ?? defaultEndMessage)}
    </div>
  );
}
