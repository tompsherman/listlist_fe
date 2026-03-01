/**
 * ConnectionStatus Component
 * 
 * Shows sync status in header:
 * - Orange animated dots = initializing/syncing
 * - Static green dots = connected/fresh data
 * - Static red dots = error/DB failed
 */

import { useState, useEffect } from 'react';
import { 
  getSyncingCount, 
  onSyncChange, 
  getErrorCount, 
  onErrorChange,
  getIsInitializing,
  onInitChange,
} from '../hooks/useCachedData';
import './ConnectionStatus.css';

/**
 * Visual indicator component
 */
export default function ConnectionStatus() {
  const [syncCount, setSyncCount] = useState(getSyncingCount());
  const [errorCount, setErrorCount] = useState(getErrorCount());
  const [initializing, setInitializing] = useState(getIsInitializing());

  useEffect(() => {
    const unsubSync = onSyncChange(setSyncCount);
    const unsubError = onErrorChange(setErrorCount);
    const unsubInit = onInitChange(setInitializing);
    return () => {
      unsubSync();
      unsubError();
      unsubInit();
    };
  }, []);

  const isSyncing = syncCount > 0 || initializing;
  const hasError = errorCount > 0;

  // Priority: error > syncing > connected
  const statusClass = hasError 
    ? 'connection-status--error' 
    : isSyncing 
      ? 'connection-status--syncing' 
      : 'connection-status--connected';

  const statusTitle = hasError
    ? 'Connection error'
    : isSyncing
      ? 'Connecting...'
      : 'Connected';

  return (
    <div 
      className={`connection-status ${statusClass}`}
      title={statusTitle}
    >
      <span className="connection-status__dot" />
      <span className="connection-status__dot" />
      <span className="connection-status__dot" />
    </div>
  );
}
