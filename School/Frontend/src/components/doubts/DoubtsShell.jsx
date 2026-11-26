import { Accent } from "../ui/Brandmarks";
import DoubtsSections from "./DoubtsSections";

/**
 * Unified compact workspace shell across every Doubts view (Class feed, Ask AI,
 * My doubts, and Thread detail). Keeps header height, tabs, and horizontal gutters
 * locked seamlessly across section switches.
 */
export default function DoubtsShell({ classLabel = "", current, exact = true, count = null, action = null, children }) {
  const showPeerControls = current !== "ask" && Boolean(count || action);

  return (
    <div className="db is-school doubts dbs is-workspace">
      <header className="dbs-workspace-bar">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <h1 className="font-display text-[1.0625rem] font-extrabold tracking-tight text-ink whitespace-nowrap">
              Class <Accent after=".">Doubts</Accent>
            </h1>
            {classLabel ? <span className="dbs-class">{classLabel}</span> : null}
          </div>
          <DoubtsSections current={current} exact={exact} inline />
        </div>

        {showPeerControls && (
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0 py-1">
            {count ? (
              <span className="dbs-count" aria-live="polite">
                {count}
              </span>
            ) : null}
            {action}
          </div>
        )}
      </header>
      <div className="dbs-body">{children}</div>
    </div>
  );
}
