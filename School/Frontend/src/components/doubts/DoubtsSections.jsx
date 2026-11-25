import { createElement } from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare, FiCpu, FiBookmark } from "react-icons/fi";

const SECTIONS = [
  { key: "class", to: "/doubts/class", label: "Class feed", icon: FiMessageSquare },
  { key: "ask", to: "/doubts/ask", label: "Ask AI", icon: FiCpu },
  { key: "mine", to: "/doubts/mine", label: "My doubts", icon: FiBookmark },
];

/**
 * The three Doubts sections as underline tabs with subtle vector icons.
 */
export default function DoubtsSections({ current, exact = true, inline = false }) {
  return (
    <nav aria-label="Doubts sections" className={inline ? "dbs-tabs is-inline" : "dbs-tabs"}>
      <ul>
        {SECTIONS.map(({ key, to, label, icon }) => (
          <li key={key} className="flex min-w-0">
            <Link
              to={to}
              className="dbs-tab w-full sm:w-auto"
              aria-current={current === key ? (exact ? "page" : "true") : undefined}
            >
              {createElement(icon, { size: 15, "aria-hidden": true })}
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
