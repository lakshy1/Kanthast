import { useEffect, useLayoutEffect, useRef } from "react";

// Two lines with the student's name, the last four digits of their phone and the session code. They drift across
// the picture all the time, bouncing off the edges at different speeds, so there is no still spot to crop out.
// If the page's own code or devtools remove or restyle them, they put themselves back.
// It is a deterrent: it makes a recording traceable to an account and a session, it cannot stop recording.

function watermarkText(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const last4 = String(user?.contactNumber || "").replace(/\D/g, "").slice(-4);
  const tail = last4 ? `•••• ${last4}` : String(user?.email || "").split("@")[0];
  return [name, tail].filter(Boolean).join("  ·  ") || "Kanthast";
}

const BASE_STYLE =
  "position:absolute;top:0;left:0;z-index:5;pointer-events:none;user-select:none;white-space:nowrap;" +
  "font:700 15px/1 system-ui,sans-serif;color:#fff;opacity:.62;padding:5px 10px;border-radius:8px;" +
  "background:rgba(0,0,0,.32);text-shadow:0 1px 2px rgba(0,0,0,.8),0 0 6px rgba(0,0,0,.5);will-change:transform;";

// Pixels per second, and the direction of each mark. Different speeds keep the two marks out of step.
const MARKS = [
  { speed: 46, angle: 28, start: [0.08, 0.12] },
  { speed: 31, angle: 205, start: [0.62, 0.7] },
];

function Mark({ text, config }) {
  const ref = useRef(null);

  // Set before first paint so it never flashes unstyled. (Not via the style prop: React rejects cssText.)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.cssText = BASE_STYLE;
  }, []);

  useEffect(() => {
    const node = ref.current;
    const parent = node?.parentElement;
    if (!node || !parent) return undefined;

    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = config.speed * (reduce ? 0.35 : 1); // slower for people who prefer less motion, never off
    const rad = (config.angle * Math.PI) / 180;
    let vx = Math.cos(rad) * speed;
    let vy = Math.sin(rad) * speed;
    let box = { w: 0, h: 0, nw: 0, nh: 0 };
    const measure = () => {
      box = { w: parent.clientWidth, h: parent.clientHeight, nw: node.offsetWidth, nh: node.offsetHeight };
    };
    measure();
    let x = config.start[0] * Math.max(0, box.w - box.nw);
    let y = config.start[1] * Math.max(0, box.h - box.nh);

    let last = performance.now();
    let frame = 0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const maxX = Math.max(0, box.w - box.nw);
      const maxY = Math.max(0, box.h - box.nh);
      x += vx * dt;
      y += vy * dt;
      if (x <= 0) { x = 0; vx = Math.abs(vx); } else if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y <= 0) { y = 0; vy = Math.abs(vy); } else if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
      node.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const resize = new ResizeObserver(measure);
    resize.observe(parent);

    // Put it back if it is removed, hidden or made see-through. The check looks at how it renders, not at
    // the style text (browsers rewrite that text), and only repairs when something is actually wrong, so
    // the repair cannot trigger itself. The motion loop rewrites the transform on the next frame.
    const tampered = () => {
      const css = getComputedStyle(node);
      return css.display === "none" || css.visibility === "hidden" || css.position !== "absolute" || Number(css.opacity) < 0.3 || node.hidden;
    };
    const guard = new MutationObserver(() => {
      if (!parent.contains(node)) parent.appendChild(node);
      if (tampered()) {
        node.hidden = false;
        node.style.cssText = BASE_STYLE;
        measure();
      }
    });
    guard.observe(parent, { childList: true });
    guard.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      guard.disconnect();
    };
  }, [text, config]);

  return <span ref={ref} aria-hidden="true" data-watermark>{text}</span>;
}

export default function SecureWatermark({ user, code = "" }) {
  // The session code names this one viewing session, so a recording can be traced to the account and the moment.
  const text = code ? `${watermarkText(user)}  ·  #${code}` : watermarkText(user);
  return (
    <>
      {MARKS.map((config, index) => (
        <Mark key={index} text={text} config={config} />
      ))}
    </>
  );
}
