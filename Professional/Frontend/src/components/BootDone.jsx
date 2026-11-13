import { useEffect } from "react";
import { hideBootLoader } from "../utils/bootLoader";

// Rendered inside the app's <Suspense>, so it only mounts once the first lazy
// page has loaded; that is the moment to take the boot loader away.
export default function BootDone() {
  useEffect(() => {
    hideBootLoader();
  }, []);
  return null;
}
