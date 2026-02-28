import { useState, useEffect } from 'react';

/**
 * useNetworkStatus
 * Returns online/offline boolean. Updates when network status changes.
 * Use for offline banners, disabling save buttons, queuing operations.
 *
 * @returns {{ isOnline: boolean, isOffline: boolean }}
 *
 * @example
 * const { isOnline, isOffline } = useNetworkStatus();
 *
 * if (isOffline) {
 *   return <OfflineBanner />;
 * }
 *
 * @example
 * <Button disabled={isOffline}>Save</Button>
 */
export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // SSR safety
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
