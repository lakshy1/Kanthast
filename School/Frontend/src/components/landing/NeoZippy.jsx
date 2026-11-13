// Neo, the owl in a lab coat with goggles pushed up, and Zippy, the
// electric-blue spark. Drawn with simple shapes so they read at any size.
export default function NeoZippy({ className = "" }) {
  return (
    <svg viewBox="0 0 420 300" role="img" aria-label="Neo the owl and Zippy the spark, the two guides in every Kanthast School lesson." className={`school-cast ${className}`}>
      <ellipse cx="210" cy="282" rx="170" ry="12" fill="#0b1b33" opacity="0.08" />
      {/* Neo */}
      <g>
        <ellipse cx="150" cy="190" rx="92" ry="88" fill="#7a5a43" />
        <path d="M80 210 Q150 300 220 210 L220 265 Q150 290 80 265 Z" fill="#ffffff" />
        <path d="M90 200 L70 280 L120 270 Z M210 200 L230 280 L180 270 Z" fill="#f1f5fb" />
        <ellipse cx="150" cy="205" rx="48" ry="44" fill="#e9d2b4" />
        <circle cx="122" cy="160" r="28" fill="#ffffff" />
        <circle cx="178" cy="160" r="28" fill="#ffffff" />
        <circle cx="126" cy="162" r="11" fill="#0b1b33" />
        <circle cx="174" cy="162" r="11" fill="#0b1b33" />
        <circle cx="130" cy="158" r="4" fill="#ffffff" />
        <circle cx="178" cy="158" r="4" fill="#ffffff" />
        <path d="M142 180 L158 180 L150 196 Z" fill="#f2a007" />
        <rect x="96" y="104" width="108" height="26" rx="13" fill="#1d4ed8" />
        <circle cx="122" cy="117" r="17" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="5" />
        <circle cx="178" cy="117" r="17" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="5" />
        <path d="M95 95 L112 112 M205 95 L188 112" stroke="#7a5a43" strokeWidth="10" strokeLinecap="round" />
      </g>
      {/* Zippy */}
      <g className="school-cast-zippy">
        <path
          d="M318 78 L336 120 L380 110 L350 146 L378 184 L332 174 L318 218 L304 174 L258 184 L286 146 L256 110 L300 120 Z"
          fill="#3b82f6"
        />
        <circle cx="306" cy="146" r="10" fill="#ffffff" />
        <circle cx="330" cy="146" r="10" fill="#ffffff" />
        <circle cx="308" cy="148" r="5" fill="#0b1b33" />
        <circle cx="332" cy="148" r="5" fill="#0b1b33" />
        <path d="M308 164 Q318 172 328 164" stroke="#0b1b33" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
