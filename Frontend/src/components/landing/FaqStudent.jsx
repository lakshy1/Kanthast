import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion as Motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

// A medical student at a desk who reacts to the FAQ beside it: puzzled while no
// question is open (thought bubble cycles through the questions), relieved
// once one is, with that answer's key sentence under the scene. Decorative
// — the accordion itself carries the content — so it is aria-hidden.

const MINT = "#6BECC9";

// The answer's lead: its first sentence, extended by the next when the first
// is only a short "Yes." or "Not yet.".
const firstSentence = (text) => {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const lead = sentences[0].trim();
  return lead.length < 20 && sentences[1] ? `${lead} ${sentences[1].trim()}` : lead;
};

export default function FaqStudent({ questions, openIndex }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [idleIndex, setIdleIndex] = useState(0);
  const answered = openIndex !== null && openIndex !== undefined;

  useEffect(() => {
    if (answered || !inView || reduce) return undefined;
    const id = setInterval(() => setIdleIndex((i) => (i + 1) % questions.length), 3200);
    return () => clearInterval(id);
  }, [answered, inView, reduce, questions.length]);

  // Cursor tracking (fine pointers only): -1..1 offsets of the pointer from
  // the head, sprung so the head eases toward it instead of snapping.
  const svgRef = useRef(null);
  const [tracking, setTracking] = useState(false);
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
      const box = svgRef.current?.getBoundingClientRect();
      if (!box) return;
      const hx = box.left + (box.width * 310) / 520;
      const hy = box.top + (box.height * 158) / 430;
      px.set(clamp(((event.clientX - hx) / box.width) * 1.8));
      py.set(clamp(((event.clientY - hy) / box.height) * 1.8));
      setTracking(true);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, inView, px, py]);

  const headX = useTransform(sx, (v) => v * 4);
  const headY = useTransform(sy, (v) => v * 3);
  const headRot = useTransform(sx, (v) => v * 4);
  const backX = useTransform(sx, (v) => v * -2);
  const earX = useTransform(sx, (v) => v * -3.5);
  const faceX = useTransform(sx, (v) => v * 1.5);
  const faceY = useTransform(sy, (v) => v * 1.2);
  const featX = useTransform(sx, (v) => v * 5.5);
  const featY = useTransform(sy, (v) => v * 4);
  const fringeX = useTransform(sx, (v) => v * 3);
  const irisX = useTransform(sx, (v) => v * 2.4);
  const irisY = useTransform(sy, (v) => v * 2.2);
  const torsoX = useTransform(sx, (v) => v * 1.2);
  const neckX = useTransform(sx, (v) => v * 3.2);
  const neckY = useTransform(sy, (v) => v * 1.5);

  const shown = answered ? openIndex : idleIndex;
  const idle = !answered && inView && !reduce;
  const swap = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.25 } };

  return (
    <div ref={ref} aria-hidden="true" className="faq-student overflow-hidden rounded-card border border-line bg-surface-raised">
      <div className="relative">
        <div className="absolute left-[5%] top-[5%] z-10 w-[56%]">
          <div className="relative rounded-2xl border border-line-strong bg-surface px-4 py-3 shadow-e3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              {answered ? "Asked" : "Wondering…"}
            </p>
            <div className="relative mt-1 min-h-[2.8em] text-sm font-semibold leading-snug text-ink sm:text-[15px]">
              <AnimatePresence mode="wait" initial={false}>
                <Motion.p key={shown} {...swap}>
                  {questions[shown].q}
                </Motion.p>
              </AnimatePresence>
            </div>
            <span className="absolute -bottom-[7px] right-[22%] h-3 w-3 rotate-45 border-b border-r border-line-strong bg-surface" />
          </div>
          <span className="absolute -bottom-6 right-[16%] h-2.5 w-2.5 rounded-full border border-line-strong bg-surface" />
        </div>

        <svg ref={svgRef} viewBox="0 0 520 430" className="block w-full" role="presentation">
          <defs>
            <radialGradient id="faq-glow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#2F6FB0" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2F6FB0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="faq-screen" cx="50%" cy="100%" r="70%">
              <stop offset="0%" stopColor={MINT} stopOpacity="0.3" />
              <stop offset="100%" stopColor={MINT} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="faq-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6CEAE" />
              <stop offset="100%" stopColor="#E8B08A" />
            </linearGradient>
            <linearGradient id="faq-hair" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5A3C2E" />
              <stop offset="50%" stopColor="#34231C" />
              <stop offset="100%" stopColor="#1E1410" />
            </linearGradient>
            <linearGradient id="faq-coat" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DCE3EC" />
              <stop offset="45%" stopColor="#F7F9FC" />
              <stop offset="100%" stopColor="#D5DDE8" />
            </linearGradient>
            <linearGradient id="faq-sleeve" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E9EEF4" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <radialGradient id="faq-metal" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#8A9AB0" />
            </radialGradient>
          </defs>

          <circle cx="300" cy="190" r="200" fill="url(#faq-glow)" />

          {/* chair back */}
          <rect x="238" y="176" width="144" height="150" rx="30" fill="#16243A" />
          <rect x="238" y="176" width="144" height="150" rx="30" fill="none" stroke="#223452" strokeWidth="2" />

          {/* neck: tall enough that its top always tucks under the chin, and
              it follows the head part of the way so the join never opens */}
          <Motion.g style={{ x: neckX, y: neckY }}>
            <path d="M295 168 C295 162 325 162 325 168 L326 222 Q310 231 294 222 Z" fill="#E2A781" />
          </Motion.g>

          <Motion.g style={{ x: torsoX }}>
          {/* coat over scrubs */}
          <path d="M234 312 C232 256 252 220 294 212 L310 226 L326 212 C368 220 388 256 386 312 Z" fill="url(#faq-coat)" />
          <path d="M294 212 L310 250 L326 212 L318 210 L310 226 L302 210 Z" fill="#1E8C86" />
          <path d="M294 212 L310 250 L326 212" fill="none" stroke="#17736E" strokeWidth="1.5" />
          {/* lapels */}
          <path d="M294 212 L286 222 L304 262 L310 250 Z" fill="#E4EAF2" stroke="#C3CDDA" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M326 212 L334 222 L316 262 L310 250 Z" fill="#E4EAF2" stroke="#C3CDDA" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M310 262 L310 312" stroke="#C3CDDA" strokeWidth="1.5" />
          {/* ID badge */}
          <rect x="266" y="232" width="18" height="24" rx="3" fill="#FFFFFF" stroke="#B8C4D4" strokeWidth="1" />
          <rect x="266" y="232" width="18" height="6" rx="2" fill={MINT} />
          <circle cx="275" cy="245" r="3.2" fill="#9AA8BC" />
          <rect x="270" y="250" width="10" height="1.8" rx="0.9" fill="#9AA8BC" />
          <line x1="275" y1="226" x2="275" y2="232" stroke="#8A9AB0" strokeWidth="1.4" />
          {/* pen in pocket */}
          <rect x="340" y="236" width="3.5" height="14" rx="1.5" fill="#4A7FD9" />
          <path d="M334 246 L352 246" stroke="#C3CDDA" strokeWidth="1.3" />

          {/* stethoscope */}
          <path d="M298 214 C284 226 284 244 292 254" fill="none" stroke="#28324A" strokeWidth="4" strokeLinecap="round" />
          <path d="M292 254 L288 262 M292 254 L297 262" stroke="#8A9AB0" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M322 214 C336 226 338 240 330 250" fill="none" stroke="#28324A" strokeWidth="4" strokeLinecap="round" />
          <circle cx="328" cy="256" r="7.5" fill="url(#faq-metal)" stroke="#6B7C93" strokeWidth="1" />
          <circle cx="328" cy="256" r="3.6" fill="#CBD5E1" />

          <path d="M262 262 C264 280 262 296 258 310" stroke="#C9D3E0" strokeWidth="1.5" fill="none" />
          <path d="M358 262 C356 280 358 296 362 310" stroke="#C9D3E0" strokeWidth="1.5" fill="none" />
          </Motion.g>

          {/* head: outer group sways while wondering; inner layers shift by
              depth with the cursor so the head reads as turning in 3D */}
          <Motion.g
            style={{ originX: "310px", originY: "204px" }}
            animate={answered ? { rotate: 0 } : idle ? { rotate: [-2, 1.5, -2] } : { rotate: -2 }}
            transition={answered ? { duration: 0.4 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Motion.g style={{ x: headX, y: headY, rotate: headRot, originX: "310px", originY: "204px" }}>
              {/* back hair */}
              <Motion.path
                style={{ x: backX }}
                d="M265 150 C256 114 278 84 312 84 C348 84 368 112 357 150 C353 136 347 127 339 121 L282 123 C274 131 268 140 265 150 Z"
                fill="url(#faq-hair)"
              />
              {/* soft shadow the chin casts on the neck, moving with the head */}
              <ellipse cx="310" cy="206" rx="17" ry="6" fill="#B97F5C" opacity="0.45" />
              {/* ears sit behind the face and slide the opposite way */}
              <Motion.g style={{ x: earX }}>
                <ellipse cx="268" cy="166" rx="7" ry="10" fill="#E3AA84" />
                <ellipse cx="352" cy="166" rx="7" ry="10" fill="#E3AA84" />
                <path d="M266 162 Q270 166 267 171" stroke="#C98F69" strokeWidth="1.4" fill="none" />
                <path d="M354 162 Q350 166 353 171" stroke="#C98F69" strokeWidth="1.4" fill="none" />
              </Motion.g>
              {/* face */}
              <Motion.g style={{ x: faceX, y: faceY }}>
                <path d="M270 152 C270 124 288 110 310 110 C332 110 350 124 350 152 L350 166 C350 192 332 206 310 206 C288 206 270 192 270 166 Z" fill="url(#faq-skin)" />
                {/* soft form shading: jaw, temples, under the fringe */}
                <path d="M274 176 C280 196 296 206 310 206 C324 206 340 196 346 176 C338 194 324 201 310 201 C296 201 282 194 274 176 Z" fill="#C98F69" opacity="0.28" />
                <ellipse cx="274" cy="156" rx="5" ry="14" fill="#C98F69" opacity="0.22" />
                <ellipse cx="346" cy="156" rx="5" ry="14" fill="#C98F69" opacity="0.22" />
                <path d="M270 152 C270 124 288 110 310 110 C332 110 350 124 350 152 L350 166 C350 192 332 206 310 206 C288 206 270 192 270 166 Z" fill="url(#faq-screen)" opacity={answered ? 0.4 : 0.18} />
              </Motion.g>

              {/* features ride nearest the viewer */}
              <Motion.g style={{ x: featX, y: featY }}>
                <ellipse cx="288" cy="182" rx="8" ry="5" fill="#F4978A" opacity={answered ? 0.5 : 0.3} />
                <ellipse cx="332" cy="182" rx="8" ry="5" fill="#F4978A" opacity={answered ? 0.5 : 0.3} />
                <path d="M308 172 Q306 179 310 181 Q313 181 314 179" stroke="#C4845E" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                <g className="faq-blink">
                  <ellipse cx="294" cy="166" rx="7.4" ry="7" fill="#FFFFFF" />
                  <ellipse cx="326" cy="166" rx="7.4" ry="7" fill="#FFFFFF" />
                  <Motion.g
                    animate={tracking ? { x: 0, y: 0 } : answered ? { x: 0, y: 0.5 } : { x: 2, y: -2 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Motion.g style={{ x: irisX, y: irisY }}>
                      <circle cx="294" cy="166.5" r="4.8" fill="#6B4226" />
                      <circle cx="326" cy="166.5" r="4.8" fill="#6B4226" />
                      <circle cx="294" cy="166.5" r="2.5" fill="#1C120C" />
                      <circle cx="326" cy="166.5" r="2.5" fill="#1C120C" />
                      <circle cx="295.8" cy="164.4" r="1.5" fill="#FFFFFF" />
                      <circle cx="327.8" cy="164.4" r="1.5" fill="#FFFFFF" />
                      <circle cx="292.6" cy="168.4" r="0.7" fill="#FFFFFF" opacity="0.8" />
                      <circle cx="324.6" cy="168.4" r="0.7" fill="#FFFFFF" opacity="0.8" />
                    </Motion.g>
                  </Motion.g>
                  {/* upper lash line */}
                  <path d="M286.4 163.6 Q294 157.6 301.6 163.4" stroke="#2A1B14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <path d="M318.4 163.4 Q326 157.6 333.6 163.6" stroke="#2A1B14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </g>

                <AnimatePresence initial={false}>
                  {answered ? (
                    <Motion.g key="happy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <path d="M285 151 Q294 146.5 302 150" stroke="#3B2A22" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                      <path d="M318 150 Q326 146.5 335 151" stroke="#3B2A22" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                      <path d="M300 189 Q310 199 320 189 Q310 193 300 189 Z" fill="#8E3B45" />
                      <path d="M302 189.6 Q310 192.4 318 189.6" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    </Motion.g>
                  ) : (
                    <Motion.g key="puzzled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <path d="M285 152 L302 150.5" stroke="#3B2A22" strokeWidth="2.8" strokeLinecap="round" />
                      <path d="M318 147 Q326 141 336 146" stroke="#3B2A22" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                      <path d="M302 192 Q306 189 310 192 Q314 194.5 318 191" stroke="#A04A55" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                    </Motion.g>
                  )}
                </AnimatePresence>
              </Motion.g>

              {/* fringe: full, textured, swept to one side */}
              <Motion.g style={{ x: fringeX, y: faceY }}>
                <path
                  d="M266 148 C260 112 286 90 316 90 C346 90 364 112 356 148 C354 137 349 128 342 122 C340 132 332 136 324 132 C320 140 308 142 300 136 C294 142 282 142 278 136 C274 142 268 146 264 150 Z"
                  fill="url(#faq-hair)"
                />
                <path d="M282 108 C296 96 322 94 342 104" stroke="#8A6250" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />
                <path d="M292 118 C304 110 322 110 334 116" stroke="#6E4C3E" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
                <path d="M300 136 C302 126 308 120 316 118" stroke="#2A1B17" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
                <path d="M324 132 C328 124 334 120 340 120" stroke="#2A1B17" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
                <path d="M278 136 C280 128 286 122 292 120" stroke="#2A1B17" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
              </Motion.g>
            </Motion.g>
          </Motion.g>

          {/* left arm resting on the desk */}
          <line x1="254" y1="236" x2="240" y2="298" stroke="#C9D3E0" strokeWidth="28" strokeLinecap="round" />
          <line x1="254" y1="236" x2="240" y2="298" stroke="url(#faq-sleeve)" strokeWidth="24" strokeLinecap="round" />
          <ellipse cx="238" cy="304" rx="13" ry="11" fill="url(#faq-skin)" />

          {/* right arm: hand on chin while wondering, on the desk once answered */}
          <Motion.g initial={false} animate={{ opacity: answered ? 0 : 1 }} transition={{ duration: 0.3 }}>
            <line x1="374" y1="298" x2="338" y2="214" stroke="#C9D3E0" strokeWidth="28" strokeLinecap="round" />
            <line x1="374" y1="298" x2="338" y2="214" stroke="url(#faq-sleeve)" strokeWidth="24" strokeLinecap="round" />
            <ellipse cx="333" cy="205" rx="12" ry="14" fill="url(#faq-skin)" transform="rotate(-20 333 205)" />
            <path d="M324 199 Q330 196 336 199" stroke="#B97F58" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </Motion.g>
          <Motion.g initial={false} animate={{ opacity: answered ? 1 : 0 }} transition={{ duration: 0.3 }}>
            <line x1="366" y1="236" x2="382" y2="298" stroke="#C9D3E0" strokeWidth="28" strokeLinecap="round" />
            <line x1="366" y1="236" x2="382" y2="298" stroke="url(#faq-sleeve)" strokeWidth="24" strokeLinecap="round" />
            <ellipse cx="384" cy="304" rx="13" ry="11" fill="url(#faq-skin)" />
          </Motion.g>

          {/* laptop (lid seen from behind) */}
          <rect x="268" y="262" width="84" height="46" rx="7" fill="#111D30" stroke="#334F73" strokeWidth="2" />
          <circle cx="310" cy="285" r="10" fill={MINT} opacity={answered ? 1 : 0.75} />
          <text x="310" y="289.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#06111F" fontFamily="Inter, sans-serif">K</text>
          <rect x="258" y="304" width="104" height="6" rx="3" fill="#3A4B63" />

          {/* desk */}
          <rect x="70" y="308" width="430" height="14" rx="7" fill="#2A3A50" />
          <rect x="92" y="322" width="14" height="108" fill="#223047" />
          <rect x="464" y="322" width="14" height="108" fill="#223047" />

          {/* textbooks, a heart model and a mug */}
          <rect x="120" y="290" width="82" height="13" rx="3" fill="#334F73" />
          <rect x="120" y="290" width="6" height="13" fill="#253A58" />
          <rect x="128" y="278" width="72" height="12" rx="3" fill="#1E8C86" />
          <rect x="128" y="278" width="6" height="12" fill="#17736E" />
          <rect x="116" y="266" width="80" height="12" rx="3" fill="#4A7FD9" />
          <rect x="116" y="266" width="6" height="12" fill="#3A68B8" />
          <rect x="146" y="270" width="30" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />
          <path d="M190 262 C184 252 172 256 174 266 C176 276 190 282 190 282 C190 282 204 276 206 266 C208 256 196 252 190 262 Z" fill="#E0566A" />
          <path d="M184 258 C184 254 188 252 190 256" stroke="#F4A3AE" strokeWidth="2" fill="none" strokeLinecap="round" />

          <rect x="430" y="276" width="30" height="32" rx="6" fill="#E3E9F1" opacity="0.92" />
          <path d="M460 284 C472 284 472 300 460 300" stroke="#E3E9F1" strokeWidth="4" fill="none" opacity="0.92" />
          <rect x="436" y="286" width="18" height="4" rx="2" fill={MINT} opacity="0.8" />
          <g className={idle || answered ? "faq-steam" : undefined} stroke="#93A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6">
            <path d="M439 268 C434 260 444 254 439 246" />
            <path d="M451 268 C446 260 456 254 451 246" />
          </g>

          {/* doubt marks, or the lightbulb once answered */}
          <AnimatePresence initial={false}>
            {!answered ? (
              <Motion.g key="marks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                {[
                  { x: 392, y: 118, size: 34, delay: "0s" },
                  { x: 424, y: 168, size: 24, delay: "1.1s" },
                  { x: 368, y: 72, size: 22, delay: "2.2s" },
                ].map((mark) => (
                  <text
                    key={mark.x}
                    x={mark.x}
                    y={mark.y}
                    fontSize={mark.size}
                    fontWeight="800"
                    fill={MINT}
                    fontFamily="Inter, sans-serif"
                    className={idle ? "faq-mark" : undefined}
                    style={{ animationDelay: mark.delay }}
                  >
                    ?
                  </text>
                ))}
              </Motion.g>
            ) : (
              <Motion.g
                key="bulb"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                style={{ originX: "400px", originY: "96px" }}
              >
                <circle cx="400" cy="96" r="30" fill={MINT} opacity="0.18" />
                <circle cx="400" cy="92" r="15" fill="#FDE68A" />
                <rect x="393" y="105" width="14" height="10" rx="3" fill="#93A3B8" />
                {[[-26, -4], [26, -4], [0, -30], [-19, -22], [19, -22]].map(([dx, dy]) => (
                  <line key={`${dx}${dy}`} x1={400 + dx * 0.7} y1={92 + dy * 0.7} x2={400 + dx} y2={92 + dy} stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
                ))}
              </Motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="border-t border-line px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
          {answered ? (
            <Motion.div key={`a${openIndex}`} {...swap}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">In short</p>
              <p className="mt-1 leading-relaxed text-ink">{firstSentence(questions[openIndex].a)}</p>
            </Motion.div>
          ) : (
            <Motion.p key="hint" {...swap} className="leading-relaxed text-ink-muted">
              Open a question to clear the doubt.
            </Motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
