/**
 * CountUpDown Component
 * Increment/decrement widget for quantity selection
 */

import './CountUpDown.css';

export default function CountUpDown({
  value = 0,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  size = 'md',
  className = '',
}) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange?.(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange?.(newValue);
  };

  const handleInputChange = (e) => {
    const inputValue = parseInt(e.target.value, 10);
    if (!isNaN(inputValue)) {
      const clampedValue = Math.max(min, Math.min(max, inputValue));
      onChange?.(clampedValue);
    }
  };

  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className={`count-up-down count-up-down-${size} ${className}`}>
      <button
        type="button"
        className="count-btn count-btn-decrement"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className="count-input"
        aria-label="Quantity"
      />
      <button
        type="button"
        className="count-btn count-btn-increment"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
