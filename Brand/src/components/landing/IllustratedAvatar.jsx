import { useId } from "react";

// A drawn, stylised avatar (not a likeness): soft gradient badge, face, hair and
// shoulders, configured per person. Used for reviewers until a real photo is added.
//
// config: { skin, hair, hairColor, shirt, glasses, bg: [from, to] }
//   hair: "short" | "sidepart" | "curly" | "long" | "ponytail"

const DEFAULTS = {
  skin: "#e0a77e",
  hair: "short",
  hairColor: "#2b1d16",
  shirt: "#2563eb",
  glasses: false,
  bg: ["#e8efff", "#c9d8fb"],
};

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amount));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function BackHair({ hair, color }) {
  if (hair === "long") {
    return <path d="M28 46 C25 22 39 14 50 14 C62 14 76 22 72 46 L74 74 C67 79 60 76 58 70 L58 42 L42 42 L42 70 C40 76 33 79 26 74 Z" fill={color} />;
  }
  if (hair === "ponytail") {
    return (
      <>
        <ellipse cx="70" cy="31" rx="9" ry="10" fill={color} />
        <path d="M70 38 C78 46 77 60 70 68 C72 58 70 48 66 42 Z" fill={color} />
      </>
    );
  }
  return null;
}

function FrontHair({ hair, color }) {
  switch (hair) {
    case "curly":
      return (
        <g fill={color}>
          <circle cx="33" cy="37" r="7" /><circle cx="38" cy="28" r="8" /><circle cx="47" cy="22" r="9" />
          <circle cx="58" cy="23" r="9" /><circle cx="66" cy="30" r="8" /><circle cx="68" cy="39" r="6" />
          <circle cx="50" cy="29" r="9" />
        </g>
      );
    case "sidepart":
      return <path d="M31 44 C28 25 40 17 52 17 C64 17 72 26 69 43 C66 35 62 31 56 30 C50 33 40 33 31 44 Z" fill={color} />;
    case "long":
    case "ponytail":
      return <path d="M31 44 C30 27 40 19 50 19 C61 19 70 27 69 44 C64 34 57 30 49 31 C42 33 35 37 31 44 Z" fill={color} />;
    default:
      return <path d="M31 43 C29 26 40 18 51 18 C63 18 72 27 69 43 C66 34 60 30 50 30 C42 30 35 34 31 43 Z" fill={color} />;
  }
}

export default function IllustratedAvatar({ config = {}, className = "", title }) {
  const c = { ...DEFAULTS, ...config };
  const id = useId().replace(/:/g, "");
  const skinShadow = shade(c.skin, -28);
  return (
    <svg viewBox="13 11 74 74" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.bg[0]} />
          <stop offset="1" stopColor={c.bg[1]} />
        </linearGradient>
        <clipPath id={`clip-${id}`}><circle cx="50" cy="48" r="37" /></clipPath>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect width="100" height="100" fill={`url(#bg-${id})`} />
        <BackHair hair={c.hair} color={c.hairColor} />
        {/* shoulders and shirt */}
        <path d="M12 104 C12 80 30 70 50 70 C70 70 88 80 88 104 Z" fill={c.shirt} />
        <path d="M42 70 L50 80 L58 70 Z" fill={shade(c.shirt, 40)} />
        {/* neck */}
        <path d="M43 58 L57 58 L57 71 C54 74 46 74 43 71 Z" fill={skinShadow} />
        {/* ears and head */}
        <ellipse cx="31.5" cy="47" rx="3.6" ry="5" fill={c.skin} />
        <ellipse cx="68.5" cy="47" rx="3.6" ry="5" fill={c.skin} />
        <ellipse cx="50" cy="45" rx="19" ry="22" fill={c.skin} />
        <FrontHair hair={c.hair} color={c.hairColor} />
        {/* brows, eyes, cheeks, smile */}
        <path d="M39 40 Q43 37.5 47 40 M53 40 Q57 37.5 61 40" stroke={shade(c.hairColor, 10)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="43" cy="46.5" rx="2.3" ry="2.7" fill="#1b1b2a" />
        <ellipse cx="57" cy="46.5" rx="2.3" ry="2.7" fill="#1b1b2a" />
        <circle cx="43.8" cy="45.6" r="0.8" fill="#fff" />
        <circle cx="57.8" cy="45.6" r="0.8" fill="#fff" />
        <circle cx="38" cy="53" r="3.2" fill="#f28b82" opacity="0.28" />
        <circle cx="62" cy="53" r="3.2" fill="#f28b82" opacity="0.28" />
        <path d="M49.2 48.5 Q50 52 48.6 52.6" stroke={skinShadow} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M44 56 Q50 61.5 56 56" stroke="#9b3d33" strokeWidth="2" fill="none" strokeLinecap="round" />
        {c.glasses && (
          <g stroke="#1b2540" strokeWidth="1.6" fill="rgba(255,255,255,0.18)">
            <rect x="36.5" y="41.5" width="13" height="10" rx="4" />
            <rect x="50.5" y="41.5" width="13" height="10" rx="4" />
            <path d="M49.5 45.5 L50.5 45.5" />
          </g>
        )}
      </g>
    </svg>
  );
}
