import React, { useEffect, useState } from "react";

// Types its text in once, with a caret, then settles into a slow sheen.
// Every character is always laid out (untyped ones are just invisible), so
// the headline never shifts while it types. Screen readers get the full text.
export default function TypedAccent({ text, className = "", startDelay = 450, speed = 85 }) {
  const [typed, setTyped] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(text.length);
      setDone(true);
      return undefined;
    }
    let i = 0;
    let timer = window.setTimeout(function tick() {
      i += 1;
      setTyped(i);
      if (i < text.length) {
        // A beat on the space, like a person typing.
        timer = window.setTimeout(tick, text[i - 1] === " " ? speed * 2.2 : speed);
      } else {
        timer = window.setTimeout(() => setDone(true), 1500);
      }
    }, startDelay);
    return () => window.clearTimeout(timer);
  }, [text, startDelay, speed]);

  const chars = [...text];
  return (
    <span className={`typed-accent ${done ? "is-done" : ""} ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="typed-accent-glyphs">
        {chars.map((ch, i) => (
          <React.Fragment key={i}>
            {typed === 0 && i === 0 ? <span className="typed-caret" /> : null}
            <span className={i < typed ? "typed-char is-in" : "typed-char"}>{ch}</span>
            {i === typed - 1 ? <span className="typed-caret" /> : null}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}
