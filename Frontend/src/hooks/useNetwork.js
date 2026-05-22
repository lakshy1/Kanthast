import { useState, useEffect } from 'react';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let networkListener = null;

    async function init() {
      try {
        const { Network } = await import('@capacitor/network');

        const status = await Network.getStatus();
        setIsOnline(status.connected);

        networkListener = await Network.addListener('networkStatusChange', (s) => {
          setIsOnline(s.connected);
        });
      } catch {
        // Running in browser — fall back to browser APIs
        setIsOnline(navigator.onLine);

        const goOnline  = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online',  goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
          window.removeEventListener('online',  goOnline);
          window.removeEventListener('offline', goOffline);
        };
      }
    }

    const cleanup = init();

    return () => {
      cleanup.then?.((fn) => fn?.());
      networkListener?.remove?.();
    };
  }, []);

  return { isOnline, offline: !isOnline };
}
