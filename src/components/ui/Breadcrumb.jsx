/**
 * Breadcrumb Component
 * Shows current location in a hierarchy.
 * Pairs with nested routing in forked projects.
 */

import './Breadcrumb.css';

export function Breadcrumb({ children, separator = '/', className = '' }) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb ${className}`}>
      <ol className="breadcrumb-list">
        {items.map((child, index) => (
          <li key={index} className="breadcrumb-item">
            {child}
            {index < items.length - 1 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BreadcrumbItem({
  href,
  onClick,
  current = false,
  children,
  className = '',
}) {
  const isLink = href || onClick;

  if (current || !isLink) {
    return (
      <span
        className={`breadcrumb-link breadcrumb-current ${className}`}
        aria-current={current ? 'page' : undefined}
      >
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <a href={href} className={`breadcrumb-link ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`breadcrumb-link breadcrumb-button ${className}`}
    >
      {children}
    </button>
  );
}

export default Breadcrumb;
