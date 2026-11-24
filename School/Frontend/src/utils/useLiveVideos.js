import { useEffect, useSyncExternalStore } from "react";
import { ensureLiveVideos, getLiveVideosVersion, subscribeLiveVideos } from "./schoolCatalogData";

/** Re-renders when the list of lessons with video changes, and starts loading it. Returns a version number. */
export default function useLiveVideos() {
  useEffect(() => {
    ensureLiveVideos();
  }, []);
  return useSyncExternalStore(subscribeLiveVideos, getLiveVideosVersion, () => 0);
}
