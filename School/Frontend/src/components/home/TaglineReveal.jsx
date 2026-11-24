import { useEffect, useRef } from "react";

/**
 * A large two line statement. Every word starts muted and lights up on its own as
 * it crosses a trigger line about two thirds of the way down the screen, in reading
 * order. Words stay lit once reached. Reduced motion shows the final text at once.
 */
export default function TaglineReveal({ lines }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const words = rootRef.current?.querySelectorAll("[data-word]");
    if (!words?.length) return undefined;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      words.forEach((w) => w.classList.add("is-on"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-on");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0 }
    );
    words.forEach((w) => observer.observe(w));
    return () => observer.disconnect();
  }, []);

  return (
    <p ref={rootRef} className="sh-tagline heading-2 max-w-[680px]">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {line.split(" ").map((word, i) => (
            <span key={`${lineIndex}-${i}`} data-word className="sh-tagline-word">
              {word}{" "}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}
