import { Children, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

/**
 * A focus carousel on plain scroll snapping. The card in the middle is full size; the others shrink and dim
 * as they move away (transform and opacity only). Built on a real scrolling track, so touch, trackpad and
 * keyboard all work natively; the arrows and the labelled progress segments mean swiping is never the only way.
 *
 * Optional gentle autoplay (autoplayMs > 0) that only runs while on screen, pauses on hover, focus and touch,
 * stops for good once the visitor interacts, never runs under reduced motion, and always has a pause button.
 */
export default function FocusCarousel({ label, children, autoplayMs = 0, slideWidth = "min(86vw, 420px)" }) {
  const items = Children.toArray(children);
  const reduce = usePrefersReducedMotion();
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  // Without IntersectionObserver there is no way to know, so treat it as visible.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [held, setHeld] = useState(false); // hover, focus or finger down
  const [stopped, setStopped] = useState(false); // the visitor took over, or pressed pause
  const running = autoplayMs > 0 && !reduce && !stopped && visible && !held;

  function goTo(index, { fromUser = false } = {}) {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;
    if (fromUser) setStopped(true);
    track.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }

  // Work out each card's distance from the middle and set --d (0 in the middle, 1 a card away or more).
  function update() {
    frame.current = 0;
    const track = trackRef.current;
    if (!track) return;
    const middle = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);
      slide.style.setProperty("--d", Math.min(1, distance / slide.offsetWidth).toFixed(3));
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setActive((current) => (current === nearest ? current : nearest));
  }
  function schedule() {
    if (!frame.current) frame.current = requestAnimationFrame(() => latest.current.update());
  }
  // Effects and listeners call the newest versions through this ref.
  const latest = useRef({});
  useLayoutEffect(() => {
    latest.current = { update, goTo, schedule };
  });

  useEffect(() => {
    const onResize = () => latest.current.schedule();
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => latest.current.goTo((active + 1) % items.length), autoplayMs);
    return () => clearTimeout(timer);
  }, [running, active, autoplayMs, items.length]);

  const onKeyDown = (event) => {
    const last = items.length - 1;
    const next = { ArrowRight: Math.min(active + 1, last), ArrowLeft: Math.max(active - 1, 0), Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    goTo(next, { fromUser: true });
  };

  return (
    <div
      className="fc"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ "--fc-w": slideWidth }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
    >
      <ul
        ref={trackRef}
        className="fc-track"
        tabIndex={0}
        aria-label={`${label} slides. Use the left and right arrow keys.`}
        onScroll={schedule}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          setHeld(true);
          if (e.pointerType === "touch") setStopped(true);
        }}
        onPointerUp={() => setHeld(false)}
      >
        {items.map((child, index) => (
          <li
            key={child.key ?? index}
            ref={(el) => (slideRefs.current[index] = el)}
            className="fc-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            aria-current={index === active ? "true" : undefined}
          >
            {child}
          </li>
        ))}
      </ul>

      <div className="fc-controls">
        <button type="button" className="fc-arrow" onClick={() => goTo(Math.max(active - 1, 0), { fromUser: true })} disabled={active === 0} aria-label="Previous slide">
          <CaretLeft weight="bold" aria-hidden="true" />
        </button>

        <div className="fc-dots" role="group" aria-label="Choose a slide">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className="fc-dot"
              data-active={index === active}
              data-running={index === active && running}
              onClick={() => goTo(index, { fromUser: true })}
              aria-label={`Go to slide ${index + 1} of ${items.length}`}
              aria-current={index === active ? "true" : undefined}
            >
              <span className="fc-dot-bar">
                <span className="fc-dot-fill" style={running && index === active ? { animationDuration: `${autoplayMs}ms` } : undefined} key={`${index}-${running && index === active ? active : "idle"}`} />
              </span>
            </button>
          ))}
        </div>

        <button type="button" className="fc-arrow" onClick={() => goTo(Math.min(active + 1, items.length - 1), { fromUser: true })} disabled={active === items.length - 1} aria-label="Next slide">
          <CaretRight weight="bold" aria-hidden="true" />
        </button>

        {autoplayMs > 0 && !reduce && (
          <button type="button" className="fc-arrow fc-pause" onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Start automatic slides" : "Pause automatic slides"}>
            {stopped ? <Play weight="fill" aria-hidden="true" /> : <Pause weight="fill" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
