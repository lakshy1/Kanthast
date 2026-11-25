import { FiMessageSquare } from "react-icons/fi";
import { Eyebrow, Accent } from "../ui/Brandmarks";
import DoubtsSections from "./DoubtsSections";

/**
 * The persistent editorial shell for every Doubts page (Class feed, Ask AI,
 * My doubts and Thread detail). Keeps header and tabs anchored across routes.
 */
export default function DoubtsShell({ classLabel = "", current, exact = true, count = null, action = null, children }) {
  const isWorkspace = current === "ask" && exact;

  if (isWorkspace) {
    return (
      <div className="db is-school doubts dbs is-ask">
        <header className="dbs-workspace-bar">
          <div className="hidden sm:flex items-center gap-2.5 min-w-0">
            <h1 className="font-display text-[1.0625rem] font-extrabold tracking-tight text-ink whitespace-nowrap">
              Class <Accent after=".">Doubts</Accent>
            </h1>
            {classLabel ? <span className="dbs-class">{classLabel}</span> : null}
          </div>
          <DoubtsSections current={current} exact={exact} inline />
        </header>
        <div className="dbs-body">{children}</div>
      </div>
    );
  }

  return (
    <div className="db is-school doubts dbs">
      <header className="dbs-head">
        <div className="dbs-heading">
          <Eyebrow icon={FiMessageSquare}>Peer &amp; AI Q&amp;A</Eyebrow>
          <div className="dbs-title-row">
            <h1 className="dbs-title">
              Class <Accent after=".">Doubts</Accent>
            </h1>
            {classLabel ? <span className="dbs-class">{classLabel}</span> : null}
          </div>
        </div>
        <div className="dbs-action">
          {count ? (
            <span className="dbs-count" aria-live="polite">
              {count}
            </span>
          ) : null}
          {action}
        </div>
      </header>
      <DoubtsSections current={current} exact={exact} />
      <div className="dbs-body">{children}</div>
    </div>
  );
}
