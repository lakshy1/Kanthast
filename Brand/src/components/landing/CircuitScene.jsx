// The animated version of the sample script's first two scenes: a switch
// closes, a queue of electrons moves round the loop, and the bulb lights.
// Pure SVG and SMIL, so it costs nothing to load. Under reduced motion it
// rests in the lit state.
const LOOP = "M80 70 H320 V210 H80 Z";

export default function CircuitScene({ light = false }) {
  // Light: matches the airy landing palette. Dark: the original navy stage.
  const c = light
    ? { bg: "#f2f6fe", wire: "#9db8ee", ink: "#1d4ed8", text: "#0b1530", electron: "#3b82f6", cap: "#c3d2ee" }
    : { bg: "#0e1f44", wire: "#5b7fc4", ink: "#e6eefb", text: "#e6eefb", electron: "#7fb4f4", cap: "#9aabc4" };
  return (
    <svg viewBox="0 0 400 280" role="img" aria-labelledby="circuit-title" className="circuit-scene">
      <title id="circuit-title">
        An animated circuit: a switch closes, electrons move around the loop, and the bulb lights up.
      </title>
      <defs>
        <radialGradient id="bulb-glow">
          <stop offset="0%" stopColor="#ffd56a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffd56a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cell" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="280" rx="22" fill={c.bg} />
      <path d={LOOP} fill="none" stroke={c.wire} strokeWidth="5" strokeLinejoin="round" />

      {/* Cell on the left wire */}
      <rect x="62" y="118" width="36" height="52" rx="6" fill="url(#cell)" stroke="#bcd4f5" strokeWidth="2" />
      <rect x="72" y="110" width="16" height="8" rx="2" fill="#bcd4f5" />
      <text x="80" y="150" textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffffff">+</text>

      {/* Bulb on the top wire */}
      <circle className="circuit-glow" cx="200" cy="52" r="58" fill="url(#bulb-glow)" />
      <circle cx="200" cy="52" r="22" className="circuit-bulb" stroke={light ? "#c3d2ee" : "#e6eefb"} strokeWidth="3" />
      <rect x="190" y="70" width="20" height="10" rx="2" fill={c.cap} />

      {/* Switch on the right wire */}
      <circle cx="320" cy="120" r="5" fill={c.ink} />
      <circle cx="320" cy="170" r="5" fill={c.ink} />
      <line className="circuit-switch" x1="320" y1="170" x2="320" y2="122" stroke={c.ink} strokeWidth="5" strokeLinecap="round" />

      {/* Electrons: a queue that moves when the switch is closed */}
      <g className="circuit-electrons">
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} r="6" fill={c.electron} stroke="#ffffff" strokeWidth="1.5">
            <animateMotion dur="6s" repeatCount="indefinite" begin={`${-i * 0.6}s`} path={LOOP} />
          </circle>
        ))}
      </g>

      <text x="200" y="252" textAnchor="middle" fontSize="15" fontWeight="700" fill={c.text}>
        I = Q / t
      </text>
    </svg>
  );
}
