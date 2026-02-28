/**
 * Accordion Component
 * Expandable panels
 */

import { useState } from 'react';
import './Accordion.css';

export function Accordion({ children, allowMultiple = false, className = '' }) {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (id) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={`accordion ${className}`}>
      {Array.isArray(children)
        ? children.map((child, index) =>
            child
              ? {
                  ...child,
                  props: {
                    ...child.props,
                    isOpen: openItems.includes(child.props.id || index),
                    onToggle: () => toggleItem(child.props.id || index),
                  },
                }
              : null
          )
        : children}
    </div>
  );
}

export function AccordionItem({
  id,
  title,
  children,
  isOpen = false,
  onToggle,
  className = '',
}) {
  return (
    <div className={`accordion-item ${isOpen ? 'accordion-item-open' : ''} ${className}`}>
      <button
        className="accordion-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
      >
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        id={`accordion-content-${id}`}
        className="accordion-content"
        role="region"
        hidden={!isOpen}
      >
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
}

export default Accordion;
