import { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaPlay, FaRobot, FaMicrophoneLines, FaCheck } from "react-icons/fa6";
import SectionHead from "./SectionHead";

function StepVisual({ id, reduce }) {
  if (id === "watch") {
    return (
      <div className="mt-4 rounded-xl border border-ink/10 bg-ink/[0.03] p-3">
        <svg viewBox="0 0 260 56" className="w-full h-12 overflow-visible" aria-hidden="true">
          <path
            d="M 8 28 Q 38 6, 68 28 T 128 28 T 188 28 T 252 28"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeWidth="2.5"
          />
          <motion.path
            d="M 8 28 Q 38 6, 68 28 T 128 28 T 188 28 T 252 28"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0.15, pathOffset: 0 }}
            animate={reduce ? { pathLength: 1 } : { pathLength: [0.25, 0.55, 0.25], pathOffset: [0, 0.75] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="252" cy="28" r="4" fill="#2563eb" />
        </svg>
      </div>
    );
  }
  if (id === "ask") {
    return (
      <div className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-xs">
        <div className="ml-auto w-fit rounded-lg bg-ink px-2.5 py-1.5 text-white">
          Why does resistance double?
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="w-fit max-w-[92%] rounded-lg bg-white px-2.5 py-1.5 text-ink shadow-sm border border-ink/10"
        >
          Electrons collide twice as often along twice the wire length.
        </motion.div>
      </div>
    );
  }
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/70 p-3">
      <div className="flex items-center gap-1 h-7" aria-hidden="true">
        {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.45].map((h, idx) => (
          <motion.span
            key={idx}
            className="w-1 rounded-full bg-emerald-600"
            animate={reduce ? { height: `${h * 22}px` } : { height: [`${h * 10}px`, `${h * 24}px`, `${h * 10}px`] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: idx * 0.08, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
        <FaCheck aria-hidden="true" className="text-[10px]" />
        Captured in 1.5s
      </span>
    </div>
  );
}

const STEPS = [
  {
    id: "watch",
    num: "01",
    icon: FaPlay,
    title: "Watch one idea",
    body: "Short animated lessons break a single concept into clear visual beats — no 45-minute lecture cramming.",
    previewLabel: "Lesson · 2m 40s",
    previewText: "Visualizing Ohm's Law: current rises linearly as voltage increases across a fixed resistor.",
  },
  {
    id: "ask",
    num: "02",
    icon: FaRobot,
    title: "Pause & ask AI",
    body: "Stuck mid-lesson? Ask Kanthast Assistant in plain language and get an instant, syllabus-grounded explanation.",
    previewLabel: "Kanthast Assistant",
    previewText: "“Why does resistance double if length doubles?” → Answered in context of the frame you paused on.",
  },
  {
    id: "practice",
    num: "03",
    icon: FaMicrophoneLines,
    title: "Prove it aloud",
    body: "Lock it in with spaced flashcards, MCQs, and voice Viva practice that checks your reasoning.",
    previewLabel: "Viva & Practice",
    previewText: "“Explain why series bulbs dim when you add another.” → Concept verified.",
  },
];

const AUTOPLAY_MS = 3500;

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const remainingMsRef = useRef(AUTOPLAY_MS);
  const startedAtRef = useRef(0);
  const current = STEPS[active];
  const Icon = current.icon;

  useEffect(() => {
    remainingMsRef.current = AUTOPLAY_MS;
  }, [active]);

  useEffect(() => {
    if (reduce || paused) return undefined;
    startedAtRef.current = performance.now();
    const delay = Math.max(0, remainingMsRef.current);
    const timer = setTimeout(() => {
      startedAtRef.current = 0;
      remainingMsRef.current = AUTOPLAY_MS;
      setActive((prev) => (prev + 1) % STEPS.length);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (startedAtRef.current > 0) {
        const elapsed = performance.now() - startedAtRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
        startedAtRef.current = 0;
      }
    };
  }, [active, paused, reduce]);

  return (
    <section aria-labelledby="how-heading" className="kx-section">
      <SectionHead
        id="how-heading"
        eyebrow="How It Works"
        before="One Idea."
        accent="Three Steps"
        note="Every lesson follows the same loop: see it clearly, clear doubts immediately, then test yourself."
      />

      <div
        className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      >
        <div className="flex flex-col gap-3" role="tablist" aria-label="Learning loop steps">
          {STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isSelected = i === active;
            return (
              <motion.button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActive(i)}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className={`text-left rounded-2xl border p-4 transition-colors ${
                  isSelected
                    ? "border-ink/20 bg-white/90 shadow-sm"
                    : "border-ink/10 bg-white/45 hover:bg-white/70"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                      isSelected ? "bg-ink text-white" : "bg-ink/5 text-ink/70"
                    }`}
                    aria-hidden="true"
                  >
                    <StepIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider uppercase opacity-50">{step.num}</span>
                      <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">{step.body}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm min-h-[250px] flex flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/80">
                <Icon aria-hidden="true" className="text-[0.85em]" />
                <span>{current.previewLabel}</span>
              </div>
              <p className="mt-3 text-base font-medium leading-relaxed text-ink">
                {current.previewText}
              </p>
              <StepVisual id={current.id} reduce={reduce} />
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const isCurrent = i === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Show step ${i + 1}: ${s.title}`}
                  onClick={() => setActive(i)}
                  className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                    isCurrent ? "w-10 bg-ink/15" : "w-2.5 bg-ink/20 hover:bg-ink/40"
                  }`}
                >
                  {isCurrent && (
                    <motion.span
                      key={`${s.id}-${active}-${paused ? "paused" : "run"}`}
                      initial={{ scaleX: reduce ? 1 : 0 }}
                      animate={{ scaleX: paused ? undefined : 1 }}
                      transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                      style={{ transformOrigin: "left" }}
                      className="absolute inset-0 rounded-full bg-ink"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
