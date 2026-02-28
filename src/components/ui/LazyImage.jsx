/**
 * LazyImage Component
 * Only loads image src when element enters viewport.
 * Powered by useIntersectionObserver.
 */

import { useRef, useState } from 'react';
import { useIntersectionObserver } from '../../hooks';
import './LazyImage.css';

export default function LazyImage({
  src,
  alt = '',
  placeholder = null,
  rootMargin = '100px',
  className = '',
  onLoad,
  onError,
  ...props
}) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    rootMargin,
    triggerOnce: true,
  });

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setError(true);
    onError?.(e);
  };

  // Default placeholder: gray box with loading indicator
  const defaultPlaceholder = (
    <div className="lazy-image-placeholder">
      <span className="lazy-image-spinner" />
    </div>
  );

  return (
    <div ref={containerRef} className={`lazy-image ${className}`}>
      {isIntersecting && !error ? (
        <>
          {!loaded && (placeholder || defaultPlaceholder)}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`lazy-image-img ${loaded ? 'lazy-image-loaded' : ''}`}
            {...props}
          />
        </>
      ) : error ? (
        <div className="lazy-image-error">
          <span>⚠️</span>
          <span>Failed to load</span>
        </div>
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
}
