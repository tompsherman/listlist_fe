/**
 * ImageWithFallback Component
 * Shows a placeholder when image src fails to load.
 * Prevents broken image icons.
 */

import { useState } from 'react';
import './ImageWithFallback.css';

export default function ImageWithFallback({
  src,
  alt = '',
  fallback,
  fallbackIcon = '🖼️',
  fallbackText = 'Image unavailable',
  className = '',
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Custom fallback component
  if (hasError && fallback) {
    return fallback;
  }

  // Default fallback
  if (hasError) {
    return (
      <div className={`image-fallback ${className}`} {...props}>
        <span className="image-fallback-icon">{fallbackIcon}</span>
        <span className="image-fallback-text">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`image-with-fallback ${className}`}>
      {isLoading && (
        <div className="image-fallback-loading">
          <span className="image-fallback-spinner" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`image-fallback-img ${isLoading ? 'image-fallback-hidden' : ''}`}
        {...props}
      />
    </div>
  );
}
