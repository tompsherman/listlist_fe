/**
 * ErrorState Component
 * Icon + message + retry button
 */

import './ErrorState.css';
import Button from './Button';

export default function ErrorState({
  icon = '⚠️',
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className = '',
  ...props
}) {
  return (
    <div className={`error-state ${className}`} {...props}>
      <span className="error-state-icon" aria-hidden="true">{icon}</span>
      <h3 className="error-state-title">{title}</h3>
      {description && (
        <p className="error-state-description">{description}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="error-state-action">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
