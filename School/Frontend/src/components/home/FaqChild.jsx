import { useEffect, useRef } from "react";
import { AnimatePresence, motion as Motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// A curious student at a desk who reacts to the FAQ beside it: wondering while no question is open (the thought
// bubble cycles through the questions), pleased once one is, with that answer's key sentence in the bubble.
// Mouse interactive on devices with a real pointer: the head and eyes follow the cursor and Zippy drifts toward it.
// Decorative only (the accordion carries the content), so it is hidden from screen readers.

export default function FaqChild({ openIndex }) {
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { amount: 0.3 });
  const reduce = useReducedMotion();
  const answered = openIndex !== null && openIndex !== undefined;

  // Cursor offsets from the head, -1 to 1, sprung so everything eases toward the pointer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 110, damping: 16, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  useEffect(() => {
    if (reduce || !inView) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const onMove = (event) => {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      px.set(clamp(((event.clientX - (box.left + box.width * 0.5)) / box.width) * 1.8));
      py.set(clamp(((event.clientY - (box.top + box.height * 0.5)) / box.height) * 1.8));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, inView, px, py]);

  const headX = useTransform(sx, (v) => v * 5);
  const headY = useTransform(sy, (v) => v * 3);
  const headRot = useTransform(sx, (v) => v * 5);
  const pupilX = useTransform(sx, (v) => v * 4);
  const pupilY = useTransform(sy, (v) => v * 3);
  const sparkX = useTransform(sx, (v) => v * 26);
  const sparkY = useTransform(sy, (v) => v * 16);

  return (
    <div ref={rootRef} aria-hidden="true" className="faq-child mx-auto w-full max-w-[380px] select-none">
      <svg viewBox="0 0 360 270" className="block h-auto w-full" role="presentation">
        <circle cx="180" cy="150" r="122" fill="#fff4dc" />
        {/* desk */}
        <rect x="26" y="226" width="308" height="14" rx="7" fill="#7a5a43" />
        <rect x="54" y="240" width="12" height="30" rx="4" fill="#5e4331" />
        <rect x="294" y="240" width="12" height="30" rx="4" fill="#5e4331" />
        {/* open notebook */}
        <g transform="translate(212 204)">
          <path d="M0 22 L44 16 L88 22 L88 4 L44 -2 L0 4 Z" fill="#ffffff" stroke="#0b1b33" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M44 -2 L44 16" stroke="#0b1b33" strokeWidth="2.5" />
          <path d="M10 8 L36 5 M10 14 L36 11 M52 5 L78 8 M52 11 L78 14" stroke="#9bb0d6" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* body */}
        <path d="M96 230 C96 190 132 178 180 178 C228 178 264 190 264 230 Z" fill="#1d4ed8" />
        <path d="M150 180 Q180 204 210 180" fill="none" stroke="#1740b3" strokeWidth="5" strokeLinecap="round" />
        {/* head, tilting toward the cursor */}
        <Motion.g style={{ x: headX, y: headY, rotate: headRot, transformOrigin: "180px 170px" }}>
          <circle cx="132" cy="132" r="9" fill="#d89a6a" />
          <circle cx="228" cy="132" r="9" fill="#d89a6a" />
          <circle cx="180" cy="128" r="50" fill="#e8ab7a" />
          <path d="M128 122 C126 78 234 78 232 122 C222 100 188 96 180 100 C172 96 138 100 128 122 Z" fill="#2a1a12" />
          <path d="M160 86 C164 74 176 72 184 78" fill="none" stroke="#2a1a12" strokeWidth="5" strokeLinecap="round" />
          {/* raised, curious brows */}
          <path d="M148 112 Q158 105 168 111 M192 111 Q202 105 212 112" fill="none" stroke="#2a1a12" strokeWidth="3.5" strokeLinecap="round" />
          {/* eyes: the pupils follow the pointer */}
          <circle cx="160" cy="130" r="13" fill="#ffffff" />
          <circle cx="200" cy="130" r="13" fill="#ffffff" />
          <Motion.g style={{ x: pupilX, y: pupilY }}>
            <circle cx="160" cy="131" r="6.5" fill="#0b1b33" />
            <circle cx="200" cy="131" r="6.5" fill="#0b1b33" />
            <circle cx="162.5" cy="128.5" r="2" fill="#ffffff" />
            <circle cx="202.5" cy="128.5" r="2" fill="#ffffff" />
          </Motion.g>
          <circle cx="146" cy="150" r="7" fill="#f0846a" opacity="0.45" />
          <circle cx="214" cy="150" r="7" fill="#f0846a" opacity="0.45" />
          {/* a small "ooh" when wondering, a smile once answered */}
          {answered ? (
            <path d="M168 154 Q180 166 192 154" fill="none" stroke="#8a3b2e" strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            <ellipse cx="180" cy="158" rx="6" ry="7.5" fill="#8a3b2e" />
          )}
        </Motion.g>
        {/* Zippy drifts toward the cursor */}
        <Motion.g style={{ x: sparkX, y: sparkY }}>
          <g transform="translate(262 38) scale(0.5)">
            <g className="faq-spark">
              <path d="M0 -40 L12 -12 L42 -18 L22 4 L40 28 L10 22 L0 50 L-10 22 L-40 28 L-22 4 L-42 -18 L-12 -12 Z" fill="#3b82f6" />
              <circle cx="-8" cy="2" r="7" fill="#fff" />
              <circle cx="10" cy="2" r="7" fill="#fff" />
              <circle cx="-6" cy="3" r="3.4" fill="#0b1b33" />
              <circle cx="12" cy="3" r="3.4" fill="#0b1b33" />
            </g>
          </g>
        </Motion.g>
        {/* floating question marks while wondering; a light bulb once answered */}
        {answered ? (
          <g transform="translate(86 64)">
            <circle cx="0" cy="0" r="13" fill="#ffd54a" /><rect x="-6" y="11" width="12" height="7" rx="2" fill="#0b1b33" />
            <path d="M-14 -22 L-18 -30 M0 -26 L0 -35 M14 -22 L18 -30" stroke="#f2a007" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : (
          <g fontFamily="Baloo 2, Hind, sans-serif" fontWeight="700" fill="#f2a007">
            <text className="faq-q faq-q1" x="82" y="70" fontSize="30">?</text>
            <text className="faq-q faq-q2" x="276" y="132" fontSize="24" fill="#3b82f6">?</text>
            <text className="faq-q faq-q3" x="60" y="150" fontSize="20" fill="#1d4ed8">?</text>
          </g>
        )}
      </svg>
    </div>
  );
}
