import { FaPlay } from "react-icons/fa6";

// Section heading in the landing design language: eyebrow pill, left-aligned
// heading with one accented, underlined word, and an optional side note.
export default function SectionHead({ id, eyebrow, icon: Icon = FaPlay, before, accent, after = ".", note, children, as: Tag = "h2" }) {
  return (
    <div className="kx-head">
      <div>
        <p className="bh-eyebrow">
          <Icon aria-hidden="true" className="bh-eyebrow-icon" />
          {eyebrow}
        </p>
        <Tag id={id} className="bp-title kx-title">
          {before}{" "}
          <span className="bh-nowrap">
            <span className="bh-click bh-accent">
              {accent}
              <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 13 C 50 5, 120 3, 197 9" />
              </svg>
            </span>
            <span className="bh-accent">{after}</span>
          </span>
        </Tag>
      </div>
      {(note || children) && (
        <div className="kx-note">
          {note && <p>{note}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

