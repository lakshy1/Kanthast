import { useEffect, useRef, useState } from "react";

/**
 * Fades a block in and lifts it 32px the first time it scrolls into view.
 * Uses IntersectionObserver (never a scroll listener) and reveals once.
 * Without IntersectionObserver the content is simply shown.
 */
export default function Reveal({ as: Tag = "div", children, className = "", delay = 0, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag ref={ref} className={`sh-reveal${shown ? " is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
