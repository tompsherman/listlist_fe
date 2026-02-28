/**
 * SlidingScale Component
 * Range input with dynamic color based on value.
 * Default: 1-3 red, 4-7 yellow, 8-10 green (sentiment scale).
 *
 * Color logic is exported separately for testability.
 */

import './SlidingScale.css';

/**
 * Get scale color based on value and thresholds.
 * @param {number} value - Current value
 * @param {Object} thresholds - { low: 3, mid: 7 } for default sentiment
 * @returns {'red' | 'yellow' | 'green'}
 */
export function getScaleColor(value, thresholds = { low: 3, mid: 7 }) {
  if (value <= thresholds.low) return 'red';
  if (value <= thresholds.mid) return 'yellow';
  return 'green';
}

/**
 * Get scale label based on color.
 * @param {'red' | 'yellow' | 'green'} color
 * @returns {string}
 */
export function getScaleLabel(color) {
  const labels = {
    red: 'Poor',
    yellow: 'Fair',
    green: 'Good',
  };
  return labels[color] || '';
}

export default function SlidingScale({
  value = 5,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  thresholds = { low: 3, mid: 7 },
  showValue = true,
  showLabel = false,
  disabled = false,
  size = 'md',
  className = '',
}) {
  const color = getScaleColor(value, thresholds);
  const label = getScaleLabel(color);

  // Calculate fill percentage for gradient
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e) => {
    onChange?.(Number(e.target.value));
  };

  return (
    <div className={`sliding-scale sliding-scale-${size} sliding-scale-${color} ${className}`}>
      <div className="sliding-scale-track">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="sliding-scale-input"
          style={{
            '--fill-percentage': `${percentage}%`,
          }}
        />
      </div>
      {(showValue || showLabel) && (
        <div className="sliding-scale-info">
          {showValue && <span className="sliding-scale-value">{value}</span>}
          {showLabel && <span className="sliding-scale-label">{label}</span>}
        </div>
      )}
    </div>
  );
}
