import { useIsFetching } from "@tanstack/react-query";
import useDelayedLoading from "../hooks/useDelayedLoading";

/**
 * Thin progress bar at the top of the screen:
 * - Used as <Suspense> fallback (isRouteLoading = true)
 * - Or mounted globally to reflect background TanStack Query fetches
 * Delayed by 180ms so instant/cached transitions never flash.
 */
export default function TopProgress({ routeFallback = true }) {
  const isFetching = useIsFetching();
  const active = routeFallback || isFetching > 0;
  const visible = useDelayedLoading(active, 180);

  if (!visible) return null;

  return (
    <div className="top-progress" role="progressbar" aria-label="Loading" aria-busy="true">
      <span />
    </div>
  );
}
