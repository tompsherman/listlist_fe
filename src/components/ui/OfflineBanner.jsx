/**
 * OfflineBanner Component
 * Persistent top bar when network is disconnected.
 * Zero configuration - just render it and it handles itself.
 */

import { useNetworkStatus } from '../../hooks';
import './OfflineBanner.css';

export default function OfflineBanner({ className = '' }) {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <div className={`offline-banner ${className}`} role="alert">
      <span className="offline-banner-icon">📡</span>
      <span className="offline-banner-text">
        You're offline — changes may not save
      </span>
    </div>
  );
}
