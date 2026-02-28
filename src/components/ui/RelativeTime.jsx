/**
 * RelativeTime Component
 * Displays "3 minutes ago", "yesterday", "2 weeks ago" from a timestamp.
 * Auto-updates periodically for recent times.
 */

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import './RelativeTime.css';

/**
 * Get relative time string
 */
function getRelativeTime(date, options = {}) {
  const { addSuffix = true } = options;
  
  try {
    return formatDistanceToNow(date, { addSuffix });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Determine update interval based on time difference
 */
function getUpdateInterval(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = diff / (1000 * 60);

  if (minutes < 1) return 10000; // Every 10s for < 1 min
  if (minutes < 60) return 60000; // Every 1m for < 1 hour
  if (minutes < 1440) return 300000; // Every 5m for < 1 day
  return null; // No updates for older times
}

export default function RelativeTime({
  date,
  live = true,
  showTooltip = true,
  tooltipFormat = 'PPpp', // "Apr 29, 2024 at 4:30 PM"
  className = '',
}) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  const isValidDate = isValid(parsedDate);

  const [relativeTime, setRelativeTime] = useState(() =>
    isValidDate ? getRelativeTime(parsedDate) : 'Invalid date'
  );

  // Auto-update for live mode
  useEffect(() => {
    if (!live || !isValidDate) return;

    const updateTime = () => {
      setRelativeTime(getRelativeTime(parsedDate));
    };

    const interval = getUpdateInterval(parsedDate);
    if (!interval) return;

    const id = setInterval(updateTime, interval);
    return () => clearInterval(id);
  }, [date, live, isValidDate, parsedDate]);

  if (!isValidDate) {
    return <span className={`relative-time ${className}`}>Invalid date</span>;
  }

  const absoluteTime = format(parsedDate, tooltipFormat);

  return (
    <time
      dateTime={parsedDate.toISOString()}
      title={showTooltip ? absoluteTime : undefined}
      className={`relative-time ${className}`}
    >
      {relativeTime}
    </time>
  );
}
