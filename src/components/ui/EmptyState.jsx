/**
 * EmptyState Component
 * Icon + message + optional CTA
 */

import './EmptyState.css';
import Button from './Button';

export default function EmptyState({
  icon = '📭',
  title = 'No data',
  description,
  action,
  actionLabel = 'Get started',
  className = '',
  ...props
}) {
  return (
    <div className={`empty-state ${className}`} {...props}>
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <Button onClick={action} variant="primary" className="empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
