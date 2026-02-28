/**
 * Tooltip Component
 * Simple CSS-based tooltip (for production, consider Floating UI)
 * Note: CSS-only tooltips can break at viewport edges
 */

import './Tooltip.css';

export default function Tooltip({
  children,
  content,
  position = 'top', // top, bottom, left, right
  className = '',
}) {
  if (!content) return children;

  return (
    <span className={`tooltip-wrapper ${className}`}>
      {children}
      <span className={`tooltip tooltip-${position}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
