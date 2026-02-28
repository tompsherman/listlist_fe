/**
 * ReadMore Component
 * Truncates text to N lines with expandable toggle.
 * Uses CSS line-clamp for truncation.
 */

import { useState } from 'react';
import './ReadMore.css';

export default function ReadMore({
  children,
  lines = 3,
  moreText = 'Read more',
  lessText = 'Show less',
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`read-more ${className}`}>
      <div
        className={`read-more-content ${expanded ? '' : 'read-more-clamped'}`}
        style={{ '--read-more-lines': lines }}
      >
        {children}
      </div>
      <button
        type="button"
        className="read-more-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? lessText : moreText}
      </button>
    </div>
  );
}
