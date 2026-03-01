/**
 * ConnectionStatus Component
 * 
 * Shows sync status in header:
 * - Orange animated dots = syncing/stale data
 * - Static green dots = connected/fresh data
 */

import { useState, useEffect } from 'react';
import { getSyncingCount, onSyncChange } from '../hooks/useCachedData';
import './ConnectionStatus.css';

/**
 * Visual indicator component
 */
export default function ConnectionStatus() {
  const [syncCount, setSyncCount] = useState(getSyncingCount());

  useEffect(() => {
    return onSyncChange(setSyncCount);
  }, []);

  const isSyncing = syncCount > 0;

  return (
    <div 
      className={`connection-status ${isSyncing ? 'connection-status--syncing' : 'connection-status--connected'}`}
      title={isSyncing ? 'Syncing with server...' : 'Connected'}
    >
      <span className="connection-status__dot" />
      <span className="connection-status__dot" />
      <span className="connection-status__dot" />
    </div>
  );
}
