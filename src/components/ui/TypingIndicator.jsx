/**
 * TypingIndicator Component
 * Three bouncing dots animation (like chat "typing" indicator)
 */

import './TypingIndicator.css';

export function TypingIndicator({
  size = 'md',
  color,
  label = 'Typing',
  showLabel = false,
  className = '',
  ...props
}) {
  const sizeClass = `typing-indicator-${size}`;
  
  return (
    <div
      className={`typing-indicator ${sizeClass} ${className}`}
      role="status"
      aria-label={label}
      {...props}
    >
      <span
        className="typing-dot"
        style={color ? { backgroundColor: color } : undefined}
      />
      <span
        className="typing-dot"
        style={color ? { backgroundColor: color } : undefined}
      />
      <span
        className="typing-dot"
        style={color ? { backgroundColor: color } : undefined}
      />
      {showLabel && <span className="typing-label">{label}</span>}
    </div>
  );
}

export default TypingIndicator;
