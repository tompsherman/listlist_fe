/**
 * CollapsibleCard Component
 * Card with clickable header that toggles body visibility
 */

import { useState } from 'react';
import './CollapsibleCard.css';

export function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
  icon,
  className = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`collapsible-card ${isOpen ? 'collapsible-card-open' : ''} ${className}`}
      {...props}
    >
      <button
        className="collapsible-card-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {icon && <span className="collapsible-card-icon">{icon}</span>}
        <span className="collapsible-card-title">{title}</span>
        <span className="collapsible-card-chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <div className="collapsible-card-body" hidden={!isOpen}>
        <div className="collapsible-card-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleCard;
