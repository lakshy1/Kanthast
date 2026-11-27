import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaCheck, FaXmark, FaBolt, FaLightbulb, FaStethoscope } from "react-icons/fa6";
import SectionHead from "./SectionHead";

const DEMOS = {
  school: {
    label: "School · Class X Physics",
    question: "If you double the voltage across a fixed 4Ω resistor, what happens to the current?",
    options: ["It halves", "It doubles", "It stays the same"],
    correct: 1,
    explanation: "By Ohm's Law (I = V / R), current rises linearly with voltage when resistance is constant.",
  },
  pro: {
    label: "Professional · NEET-PG",
    question: "Which nerve is most commonly injured in a fracture of the surgical neck of the humerus?",
    options: ["Radial nerve", "Axillary nerve", "Ulnar nerve"],
    correct: 1,
    explanation: "The axillary nerve winds around the surgical neck of the humerus, placing it at highest risk.",
  },
};

export default function InteractiveTeaser() {
  const [track, setTrack] = useState("school");
  const [selected, setSelected] = useState(null);
  const [voltage, setVoltage] = useState(6);
  const [abductionDeg, setAbductionDeg] = useState(45);
  const reduce = useReducedMotion();
  const demo = DEMOS[track];
  const isCorrect = selected === demo.correct;
  const currentAmps = (voltage / 4).toFixed(1);
  const glowOpacity = Math.min(1, 0.25 + (voltage / 12) * 0.75);
  const activeMuscle =
    abductionDeg <= 15
      ? "Supraspinatus (0°–15°)"
      : abductionDeg <= 90
      ? "Deltoid · Axillary nerve (15°–90°)"
      : "Trapezius & Serratus (>90°)";
  const isDeltoidZone = abductionDeg > 15 && abductionDeg <= 90;

  const switchTrack = (nextTrack) => {
    setTrack(nextTrack);
    setSelected(null);
  };

  return (
    <section aria-labelledby="teaser-heading" className="kx-section">
      <SectionHead
        id="teaser-heading"
        eyebrow="Try It Now"
        icon={FaBolt}
        before="Test One"
        accent="Idea"
        note="Play with the concept, then answer one quick question — see how Kanthast builds intuition."
      />

      <div className="mt-8 rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{demo.label}</span>
          <div className="inline-flex rounded-full bg-ink/5 p-1">
            {[
              { id: "school", text: "School" },
              { id: "pro", text: "Professional" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTrack(tab.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                  track === tab.id ? "bg-ink text-white" : "text-ink/70 hover:text-ink"
                }`}
              >
                {tab.text}
              </button>
            ))}
          </div>
        </div>

        {track === "school" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-600 transition-all"
                style={{
                  boxShadow: `0 0 ${Math.round(voltage * 1.8)}px rgba(245, 158, 11, ${glowOpacity})`,
                  opacity: glowOpacity,
                }}
                aria-hidden="true"
              >
                <FaLightbulb className="text-lg" />
              </span>
              <div className="text-xs">
                <div className="font-semibold text-ink">
                  Voltage: <span className="tabular-nums">{voltage}V</span> → Current:{" "}
                  <span className="tabular-nums text-blue-700">{currentAmps}A</span>
                </div>
                <div className="text-ink/60">Fixed resistor R = 4Ω · Drag to test</div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-ink/75">
              <span>2V</span>
              <input
                type="range"
                min={2}
                max={12}
                step={2}
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                aria-label="Adjust circuit voltage"
                className="accent-ink cursor-pointer"
              />
              <span>12V</span>
            </label>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isDeltoidZone ? "bg-blue-600 text-white shadow-sm" : "bg-ink/10 text-ink/70"
                }`}
                aria-hidden="true"
              >
                <FaStethoscope className="text-base" />
              </span>
              <div className="text-xs">
                <div className="font-semibold text-ink">
                  Abduction: <span className="tabular-nums">{abductionDeg}°</span> →{" "}
                  <span className={isDeltoidZone ? "text-blue-700" : "text-ink/80"}>{activeMuscle}</span>
                </div>
                <div className="text-ink/60">Shoulder abduction biomechanics · Drag to test</div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-ink/75">
              <span>0°</span>
              <input
                type="range"
                min={0}
                max={120}
                step={15}
                value={abductionDeg}
                onChange={(e) => setAbductionDeg(Number(e.target.value))}
                aria-label="Adjust shoulder abduction angle"
                className="accent-ink cursor-pointer"
              />
              <span>120°</span>
            </label>
          </div>
        )}

        <h3 className="mt-4 text-lg font-semibold text-ink">{demo.question}</h3>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {demo.options.map((opt, idx) => {
            const picked = selected === idx;
            const right = idx === demo.correct;
            let stateClass = "border-ink/15 bg-white hover:border-ink/35";
            if (selected !== null) {
              if (right) stateClass = "border-emerald-500/60 bg-emerald-50 text-emerald-950";
              else if (picked) stateClass = "border-rose-400/60 bg-rose-50 text-rose-950";
              else stateClass = "border-ink/10 bg-white/60 opacity-60";
            }

            return (
              <motion.button
                key={opt}
                type="button"
                onClick={() => setSelected(idx)}
                whileHover={reduce ? undefined : { y: -1 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${stateClass}`}
              >
                <span>{opt}</span>
                {selected !== null && right && <FaCheck className="text-emerald-600" aria-hidden="true" />}
                {selected !== null && picked && !right && <FaXmark className="text-rose-600" aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                isCorrect ? "bg-emerald-500/10 text-emerald-950" : "bg-amber-500/10 text-amber-950"
              }`}
            >
              <strong className="font-semibold">{isCorrect ? "Spot on. " : "Not quite. "}</strong>
              {demo.explanation}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
