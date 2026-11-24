import { Fragment, useEffect, useRef } from "react";

// Centred, pinned statement that lights up one character at a time as you scroll.
// A single --p (0 to 1) is written to the section once per animation frame, and
// every character works out its own state from it in CSS: opacity and a small lift
// (transform and opacity only), plus a soft glow that peaks at the leading edge and
// fades as the character settles. Words never break mid word. `*word*` marks the
// one accent word. Reduced motion shows the finished text with no pinning.

function parseLine(line) {
  return line.split(" ").map((raw) => {
    const m = raw.match(/^(.*?)\*(.+?)\*(.*)$/);
    if (!m) return [{ text: raw, accent: false }];
    return [
      m[1] && { text: m[1], accent: false },
      { text: m[2], accent: true },
      m[3] && { text: m[3], accent: false },
    ].filter(Boolean);
  });
}

export default function ScrollTagline({ lines, label, accent = "#f2a007", glow = "255 214 102", textClass = "" }) {
  const rootRef = useRef(null);
  const plain = lines.join(" ").replace(/\*/g, "");

  let index = 0;
  const built = lines.map((line) =>
    parseLine(line).map((parts) =>
      parts.map((part) => ({ ...part, chars: [...part.text].map((ch) => ({ ch, i: index++ })) }))
    )
  );
  const total = index;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--p", "1");
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts when the section's top reaches 60% of the screen, finishes just before it unpins.
      const progress = (vh * 0.6 - rect.top) / Math.max(1, rect.height - vh * 0.6);
      root.style.setProperty("--p", Math.min(1, Math.max(0, progress)).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Only listen while the section is near the screen.
    let listening = false;
    const on = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      schedule();
    };
    const off = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? on() : off()), { rootMargin: "100% 0px 100% 0px" });
    observer.observe(root);
    update();
    return () => {
      observer.disconnect();
      off();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={rootRef} aria-label={label} className="stag" style={{ "--n": total, "--accent": accent, "--glow": glow }}>
      <div className="stag-pin">
        <div className="stag-orb" aria-hidden="true" />
        <p className={`stag-text ${textClass}`}>
          <span className="sr-only">{plain}</span>
          <span aria-hidden="true">
            {built.map((words, li) => (
              <span key={li} className="stag-line">
                {words.map((parts, wi) => (
                  <Fragment key={wi}>
                    {wi > 0 ? " " : null}
                    <span className="stag-word">
                      {parts.flatMap((part) => part.chars.map(({ ch, i }) => (
                        <span key={i} className={`stag-char${part.accent ? " stag-accent" : ""}`} style={{ "--i": i }}>{ch}</span>
                      )))}
                    </span>
                  </Fragment>
                ))}
              </span>
            ))}
          </span>
        </p>
        <span className="stag-rule" aria-hidden="true" />
      </div>
    </section>
  );
}
