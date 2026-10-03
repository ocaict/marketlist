import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    Network.getStatus()
      .then((status) => {
        if (mounted) setIsOffline(!status.connected);
      })
      .catch(() => {
        // Plugin unavailable (e.g., plain web build) — assume online.
      });

    const listenerPromise = Network.addListener('networkStatusChange', (status) => {
      setIsOffline(!status.connected);
    });

    return () => {
      mounted = false;
      listenerPromise.then((listener) => listener.remove()).catch(() => {});
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-banner" role="alert">
      You are currently offline. Some features require an internet connection.
    </div>
  );
}

export default OfflineBanner;
