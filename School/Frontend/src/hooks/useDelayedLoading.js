import { useEffect, useState } from "react";

/**
 * Suppresses loading indicators for fast (< 200ms) responses so cached or
 * rapid transitions never flash a spinner or skeleton.
 */
export default function useDelayedLoading(isLoading, delay = 200) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setReady(true), delay);
    return () => {
      clearTimeout(timer);
      setReady(false);
    };
  }, [isLoading, delay]);

  return Boolean(isLoading && ready);
}
