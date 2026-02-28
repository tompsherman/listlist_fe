/**
 * CharacterCounter Component
 * Wraps a textarea with live character count and limit indicator.
 * Turns warning/error as limit approaches.
 */

import { forwardRef } from 'react';
import './CharacterCounter.css';

const CharacterCounter = forwardRef(function CharacterCounter(
  {
    value = '',
    onChange,
    maxLength = 280,
    warningThreshold = 0.8, // Show warning at 80% of max
    placeholder = '',
    disabled = false,
    rows = 3,
    className = '',
    ...props
  },
  ref
) {
  const length = value.length;
  const remaining = maxLength - length;
  const percentage = length / maxLength;

  let status = 'normal';
  if (percentage >= 1) {
    status = 'error';
  } else if (percentage >= warningThreshold) {
    status = 'warning';
  }

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`character-counter ${className}`}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="character-counter-textarea"
        {...props}
      />
      <div className={`character-counter-display character-counter-${status}`}>
        <span className="character-counter-remaining">{remaining}</span>
        <span className="character-counter-max">/ {maxLength}</span>
      </div>
    </div>
  );
});

export default CharacterCounter;
