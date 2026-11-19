import DoubtsSections from "./DoubtsSections";

/**
 * The one layout for every Doubts page (Class feed, Ask AI, My doubts and a
 * thread). Top to bottom:
 *
 *   header   "Doubts" + the class chip at left; the page's single primary
 *            action ("Ask your class" and the posts-left count) at right
 *   tabs     Class feed / Ask AI / My doubts on a hairline
 *   body     the section (or the class / parent-approval step)
 *
 * The header and tabs have fixed heights and sit at the content edge
 * (--kb-edge, from .db), so they are pixel-identical on all four pages and
 * nothing above the body moves when the student switches section. The Doubts
 * page renders this once for all four routes, so it also stays mounted.
 */
export default function DoubtsShell({ classLabel = "", current, exact = true, count = null, action = null, children }) {
  return (
    <div className="db is-school doubts dbs">
      <header className="dbs-head">
        <div className="dbs-heading">
          <h1 className="dbs-title">Doubts</h1>
          {classLabel ? <span className="dbs-class">{classLabel}</span> : null}
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
