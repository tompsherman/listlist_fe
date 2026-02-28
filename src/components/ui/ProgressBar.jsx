/**
 * ProgressBar Component
 * Horizontal progress indicator with configurable color.
 * Use for file uploads, multi-step forms, loading sequences.
 */

import './ProgressBar.css';

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'primary',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  animated = false,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const roundedPercentage = Math.round(percentage);

  return (
    <div className={`progress-bar progress-bar-${size} ${className}`}>
      {showLabel && labelPosition === 'left' && (
        <span className="progress-bar-label">{roundedPercentage}%</span>
      )}
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`progress-bar-fill progress-bar-${color} ${animated ? 'progress-bar-animated' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && labelPosition === 'right' && (
        <span className="progress-bar-label">{roundedPercentage}%</span>
      )}
    </div>
  );
}
