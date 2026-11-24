import { Children, useEffect, useRef, useState } from "react";

/**
 * A grid on tablets and desktops; on phones the same cards become a swipeable
 * row that snaps one card at a time, with the next card peeking in and dots
 * underneath. Tracks the visible card with IntersectionObserver.
 */
export default function SnapRow({ children, label, columns = "md:grid-cols-3", itemWidth = "w-[85%]", onActiveChange }) {
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setActive(index);
            onActiveChange?.(index);
          }
        });
      },
      { root: track, threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length, onActiveChange]);

  const goTo = (index) => {
    const el = itemRefs.current[index];
    if (!el || !trackRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackRef.current.scrollTo({ left: el.offsetLeft - trackRef.current.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="min-w-0">
      <ul
        ref={trackRef}
        aria-label={label}
        className={`sh-snap flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:gap-6 md:overflow-visible md:pb-0 ${columns}`}
      >
        {items.map((child, index) => (
          <li
            key={child.key ?? index}
            ref={(el) => (itemRefs.current[index] = el)}
            data-index={index}
            className={`${itemWidth} shrink-0 snap-start md:w-auto`}
          >
            {child}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-center md:hidden">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show ${label.toLowerCase()} ${index + 1} of ${items.length}`}
            aria-current={active === index ? "true" : undefined}
            className="grid h-6 w-6 place-items-center rounded-full"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active === index ? "w-6 bg-[var(--school-ink)]" : "w-2 bg-line-strong"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
