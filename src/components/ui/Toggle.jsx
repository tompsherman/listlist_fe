/**
 * Toggle Component
 * Switch for boolean settings
 */

import './Toggle.css';

export default function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
  id,
  className = '',
  ...props
}) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && onChange) {
        onChange(!checked);
      }
    }
  };

  return (
    <label className={`toggle-wrapper ${disabled ? 'toggle-disabled' : ''} ${className}`} htmlFor={toggleId}>
      <input
        type="checkbox"
        id={toggleId}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="toggle-input"
        {...props}
      />
      <span 
        className={`toggle toggle-${size}`}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}
