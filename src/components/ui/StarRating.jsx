/**
 * StarRating Component
 * Interactive star rating with hover preview.
 * Controlled: value and onChange from parent.
 */

import { useState } from 'react';
import './StarRating.css';

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  readOnly = false,
  showValue = false,
  className = '',
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const displayValue = hoverValue ?? value;
  const interactive = !disabled && !readOnly;

  const handleClick = (rating) => {
    if (!interactive) return;
    // Toggle off if clicking same value
    onChange?.(rating === value ? 0 : rating);
  };

  const handleMouseEnter = (rating) => {
    if (!interactive) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
    <div
      className={`star-rating star-rating-${size} ${disabled ? 'star-rating-disabled' : ''} ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="star-rating-stars" role="group" aria-label={`Rating: ${value} out of ${max}`}>
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1;
          const filled = rating <= displayValue;

          return (
            <button
              key={rating}
              type="button"
              className={`star-rating-star ${filled ? 'star-rating-filled' : ''}`}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              disabled={disabled}
              tabIndex={readOnly ? -1 : 0}
              aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="star-rating-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="star-rating-value">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
