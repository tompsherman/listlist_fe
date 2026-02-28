/**
 * NotificationBadge Component
 * Small number indicator that overlays on icons.
 * Like unread count on a bell icon.
 */

import './NotificationBadge.css';

export default function NotificationBadge({
  count = 0,
  max = 99,
  showZero = false,
  dot = false,
  color = 'error',
  children,
  className = '',
}) {
  const shouldShow = dot || (showZero ? count >= 0 : count > 0);
  const displayCount = count > max ? `${max}+` : count;

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <div className={`notification-badge-wrapper ${className}`}>
      {children}
      <span
        className={`notification-badge notification-badge-${color} ${dot ? 'notification-badge-dot' : ''}`}
      >
        {!dot && displayCount}
      </span>
    </div>
  );
}
