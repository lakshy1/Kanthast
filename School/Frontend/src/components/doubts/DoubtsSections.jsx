import { Link } from "react-router-dom";

const SECTIONS = [
  { key: "class", to: "/doubts/class", label: "Class feed" },
  { key: "ask", to: "/doubts/ask", label: "Ask AI" },
  { key: "mine", to: "/doubts/mine", label: "My doubts" },
];

/**
 * The three Doubts sections as underline tabs on a hairline (styles: .dbs-tab
 * in index.css). Each tab is a 44px-tall link. Phone: three equal columns
 * across the width; from sm: a left-aligned row whose first label starts at
 * the content edge.
 *
 * `current` is the section to mark. On a section page it is that page
 * (aria-current="page"); on a thread it is the list the student came from,
 * marked aria-current="true" because the thread is not that page itself.
 */
export default function DoubtsSections({ current, exact = true }) {
  return (
    <nav aria-label="Doubts sections" className="dbs-tabs">
      <ul>
        {SECTIONS.map(({ key, to, label }) => (
          <li key={key} className="flex min-w-0">
            <Link
              to={to}
              className="dbs-tab w-full sm:w-auto"
              aria-current={current === key ? (exact ? "page" : "true") : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
