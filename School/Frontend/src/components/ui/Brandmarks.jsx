import { FaPlay } from "react-icons/fa6";

// Small pieces of the shared Kanthast design language (see index.css, "Kanthast design language").

/** Eyebrow pill above a heading: soft blue, small icon. */
export function Eyebrow({ children, icon: Icon = FaPlay, className = "" }) {
  return (
    <p className={`bh-eyebrow ${className}`}>
      <Icon aria-hidden="true" className="bh-eyebrow-icon" />
      {children}
    </p>
  );
}

/** One accented word in a heading: blue, with the hand-drawn underline. `after` is the trailing mark (default "."). */
export function Accent({ children, after = "." }) {
  return (
    <span className="bh-nowrap">
      <span className="bh-click bh-accent">
        {children}
        <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
          <path d="M3 13 C 50 5, 120 3, 197 9" />
        </svg>
      </span>
      {after ? <span className="bh-accent">{after}</span> : null}
    </span>
  );
}
