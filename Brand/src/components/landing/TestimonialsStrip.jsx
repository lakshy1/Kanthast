import { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaQuoteLeft } from "react-icons/fa6";
import { VISIBLE_TESTIMONIALS } from "../../data/testimonials";
import IllustratedAvatar from "./IllustratedAvatar";
import SectionHead from "./SectionHead";

const AUTOPLAY_MS = 3500;

function wrappedOffset(index, active, total) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export default function TestimonialsStrip() {
  const items = VISIBLE_TESTIMONIALS;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const remainingMsRef = useRef(AUTOPLAY_MS);
  const startedAtRef = useRef(0);

  useEffect(() => {
    remainingMsRef.current = AUTOPLAY_MS;
  }, [active]);

  useEffect(() => {
    if (reduce || paused || items.length <= 1) return undefined;
    startedAtRef.current = performance.now();
    const delay = Math.max(0, remainingMsRef.current);
    const timer = setTimeout(() => {
      startedAtRef.current = 0;
      remainingMsRef.current = AUTOPLAY_MS;
      setActive((prev) => (prev + 1) % items.length);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (startedAtRef.current > 0) {
        const elapsed = performance.now() - startedAtRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
        startedAtRef.current = 0;
      }
    };
  }, [active, paused, reduce, items.length]);

  if (!items.length) return null;

  return (
    <section aria-labelledby="reviews-heading" className="kx-section">
      <SectionHead
        id="reviews-heading"
        eyebrow="Pilot Feedback"
        icon={FaQuoteLeft}
        before="What Early"
        accent="Learners Say"
        note="Notes from our pilot testers — shared with their permission."
      />

      <div
        className="mt-10 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      >
        <div
          className="relative mx-auto h-[270px] sm:h-[250px] max-w-4xl"
          style={{ perspective: "1200px" }}
        >
          {items.map((item, idx) => {
            const offset = wrappedOffset(idx, active, items.length);
            const abs = Math.abs(offset);
            const isVisible = abs <= 1;
            const isCenter = offset === 0;

            return (
              <motion.figure
                key={item.name}
                onClick={() => setActive(idx)}
                initial={false}
                animate={{
                  x: `${offset * 68}%`,
                  scale: isCenter ? 1 : 0.86,
                  rotateY: reduce ? 0 : offset * -14,
                  opacity: isVisible ? (isCenter ? 1 : 0.52) : 0,
                  zIndex: isCenter ? 30 : isVisible ? 20 : 10,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                style={{
                  transformStyle: "preserve-3d",
                  pointerEvents: isVisible ? "auto" : "none",
                }}
                className={`absolute left-0 right-0 mx-auto top-0 w-[86%] sm:w-[440px] cursor-pointer rounded-3xl border p-6 sm:p-7 backdrop-blur-md transition-shadow ${
                  isCenter
                    ? "border-ink/15 bg-white/95 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.16)]"
                    : "border-ink/10 bg-white/75 shadow-[0_12px_30px_-10px_rgba(15,23,42,0.08)]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md">
                    <IllustratedAvatar config={item.avatar} title={item.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-ink">{item.name}</div>
                    <div className="text-xs font-medium text-ink/55">{item.role}</div>
                  </div>
                  <FaQuoteLeft className="ml-auto text-lg text-ink/15" aria-hidden="true" />
                </div>

                <blockquote className="mt-5 text-[15px] sm:text-base font-medium leading-relaxed text-ink/90">
                  “{item.quote}”
                </blockquote>
              </motion.figure>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setActive((prev) => (prev - 1 + items.length) % items.length)}
            aria-label="Previous testimonial"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/85 text-ink/80 shadow-sm transition hover:bg-white hover:text-ink"
          >
            <FaChevronLeft className="text-xs" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Choose testimonial">
            {items.map((item, i) => {
              const isCurrent = i === active;
              return (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Show testimonial from ${item.name}`}
                  onClick={() => setActive(i)}
                  className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                    isCurrent ? "w-9 bg-ink/15" : "w-2 bg-ink/20 hover:bg-ink/40"
                  }`}
                >
                  {isCurrent && (
                    <motion.span
                      key={`${item.name}-${active}-${paused ? "paused" : "run"}`}
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

          <button
            type="button"
            onClick={() => setActive((prev) => (prev + 1) % items.length)}
            aria-label="Next testimonial"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/85 text-ink/80 shadow-sm transition hover:bg-white hover:text-ink"
          >
            <FaChevronRight className="text-xs" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
