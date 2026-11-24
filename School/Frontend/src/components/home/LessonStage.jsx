import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";
import { NeoG, ZippyG } from "./Characters";

// One circuit, drawn the way a Kanthast lesson draws it. It is an illustration
// taken from the Class X Science script, not a finished lesson. `step` picks the
// moment: 0 hook, 1 drawn step by step, 2 exam tip, 3 recap. Everything that
// moves uses transform and opacity (plus the wire's draw-on).
const LOOP =
  "M170 120 H390 Q410 120 410 140 V280 Q410 300 390 300 H170 Q150 300 150 280 V140 Q150 120 170 120 Z";

export default function LessonStage({ step = 1, interactive = false, className = "" }) {
  const rootRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  // Eyes follow the pointer inside the stage, then settle back. rAF throttled.
  useEffect(() => {
    const root = rootRef.current;
    if (!interactive || !root || reduce) return undefined;
    let frame = 0;
    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = root.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        root.style.setProperty("--ex", `${Math.max(-1, Math.min(1, dx)) * 5}px`);
        root.style.setProperty("--ey", `${Math.max(-1, Math.min(1, dy)) * 4}px`);
      });
    };
    const onLeave = () => {
      root.style.setProperty("--ex", "0px");
      root.style.setProperty("--ey", "0px");
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [interactive, reduce]);

  const electrons = [0, 1, 2, 3, 4, 5];

  return (
    <div ref={rootRef} className={`sh-stage ${className}`} data-step={step}>
      <svg viewBox="0 0 560 420" role="img" aria-label="An illustrated circuit being drawn step by step, from the Class X Science script: a cell, a switch and a bulb joined by a wire.">
        <rect width="560" height="420" fill="#fff4dc" />

        {/* bulb glow sits behind the wire */}
        <circle className="bulb-glow" cx="410" cy="210" r="62" fill="#ffd54a" />

        {/* the circuit */}
        <path d={LOOP} fill="none" stroke="#d9c9a3" strokeWidth="12" strokeLinecap="round" />
        <path className="wire-live" d={LOOP} pathLength="1" fill="none" stroke="#1d4ed8" strokeWidth="12" strokeLinecap="round" />

        {/* cell */}
        <g>
          <rect x="132" y="190" width="36" height="60" rx="6" fill="#ffffff" stroke="#0b1b33" strokeWidth="4" />
          <rect x="144" y="180" width="12" height="10" rx="2" fill="#0b1b33" />
          <text x="150" y="226" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1d4ed8">+</text>
        </g>

        {/* switch */}
        <g>
          <circle cx="240" cy="120" r="7" fill="#0b1b33" />
          <circle cx="320" cy="120" r="7" fill="#0b1b33" />
          <line className="lever" x1="240" y1="120" x2="318" y2="120" stroke="#0b1b33" strokeWidth="7" strokeLinecap="round" />
        </g>

        {/* bulb */}
        <g>
          <circle cx="410" cy="210" r="26" fill="#fff8d6" stroke="#0b1b33" strokeWidth="4" />
          <path d="M398 216 L404 204 L410 216 L416 204 L422 216" stroke="#f2a007" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="398" y="234" width="24" height="12" rx="3" fill="#0b1b33" />
        </g>

        {/* the electron queue */}
        <g className="electrons">
          {electrons.map((i) =>
            reduce ? (
              <circle key={i} cx={170 + i * 44} cy={120} r="6" fill="#ffffff" stroke="#1d4ed8" strokeWidth="3" />
            ) : (
              <circle key={i} r="6" fill="#ffffff" stroke="#1d4ed8" strokeWidth="3">
                <animateMotion dur="6s" begin={`${-i}s`} repeatCount="indefinite" path={LOOP} />
              </circle>
            )
          )}
        </g>

        {/* characters */}
        <g transform="translate(6 262) scale(0.5)"><NeoG /></g>
        <g className="zippy-wrap" transform="translate(322 262) scale(0.46)"><ZippyG /></g>

        {/* the dark room lifts when the bulb comes on */}
        <rect className="dark-room" width="560" height="420" fill="#0b1b33" pointerEvents="none" />

        {/* exam tip */}
        <g className="tip">
          <rect x="190" y="150" width="180" height="96" rx="14" fill="#ffffff" stroke="#0b1b33" strokeWidth="3" />
          <text x="280" y="180" textAnchor="middle" fontSize="13" fontWeight="700" fill="#8a4b05">EXAM TIP</text>
          <text x="280" y="214" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0b1b33">I = Q / t</text>
          <text x="280" y="236" textAnchor="middle" fontSize="12" fill="#4a5a75">charge per unit time</text>
        </g>

        {/* three point recap */}
        <g className="recap">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${196 + i * 62} 188)`}>
              <circle cx="22" cy="22" r="22" fill="#ffffff" stroke="#0b1b33" strokeWidth="3" />
              <text x="22" y="30" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1d4ed8">{i + 1}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
