import { useLayoutEffect, useRef } from "react";

// One line with the student's name, the last four digits of their phone and the session code. It drifts across
// the whole picture all the time, bouncing off the edges on a path that keeps bending, so there is no still spot
// to crop out and no straight line to track. If the page's own code or devtools remove or restyle it, it puts itself back.
// It is a deterrent: it makes a recording traceable to an account and a session, it cannot stop recording.

function watermarkText(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const last4 = String(user?.contactNumber || "").replace(/\D/g, "").slice(-4);
  const tail = last4 ? `•••• ${last4}` : String(user?.email || "").split("@")[0];
  return [name, tail].filter(Boolean).join("  ·  ") || "Kanthast";
}

const BASE_STYLE =
  "position:absolute;top:0;left:0;z-index:5;pointer-events:none;user-select:none;white-space:nowrap;" +
  "font:700 16px/1 system-ui,sans-serif;color:#fff;opacity:.68;padding:5px 10px;border-radius:8px;" +
  "background:rgba(0,0,0,.32);text-shadow:0 1px 2px rgba(0,0,0,.8),0 0 6px rgba(0,0,0,.5);will-change:transform;";

// Pixels per second and the starting direction (degrees).
const MARK = { speed: 44, angle: 28, start: [0.1, 0.15] };

function Mark({ text, config }) {
  const ref = useRef(null);

  // Set before first paint so it never flashes unstyled. (Not via the style prop: React rejects cssText.)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.cssText = BASE_STYLE;
  }, []);

  // A layout effect, so its cleanup runs before React removes the player from the page. Everything below stops
  // at that moment: nothing may keep reacting to a mark that has been taken off the page.
  useLayoutEffect(() => {
    const node = ref.current;
    const parent = node?.parentElement;
    if (!node || !parent) return undefined;

    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = config.speed * (reduce ? 0.35 : 1); // slower for people who prefer less motion, never off
    let heading = (config.angle * Math.PI) / 180;
    let box = { w: 0, h: 0, nw: 0, nh: 0 };
    const measure = () => {
      box = { w: parent.clientWidth, h: parent.clientHeight, nw: node.offsetWidth, nh: node.offsetHeight };
    };
    measure();
    let x = config.start[0] * Math.max(0, box.w - box.nw);
    let y = config.start[1] * Math.max(0, box.h - box.nh);

    // Put it back if it is removed, hidden or made see-through. The check looks at how it renders, not at the
    // style text (browsers rewrite that text). The observer only raises a flag; the repair itself happens at most
    // once a frame, so a repair that cannot succeed can never spin the page in a loop.
    let dirty = false;
    let stopped = false;
    const tampered = () => {
      const css = getComputedStyle(node);
      return css.display === "none" || css.visibility === "hidden" || css.position !== "absolute" || Number(css.opacity) < 0.3 || node.hidden;
    };
    const guard = new MutationObserver(() => { dirty = true; });
    guard.observe(parent, { childList: true });
    guard.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    const resize = new ResizeObserver(measure);
    resize.observe(parent);

    let last = performance.now();
    let frame = 0;
    const tick = (now) => {
      if (stopped) return;
      if (!parent.isConnected) return; // the player has left the page: stop, do not touch anything
      if (dirty) {
        dirty = false;
        if (!parent.contains(node)) parent.appendChild(node);
        if (tampered()) {
          node.hidden = false;
          node.style.cssText = BASE_STYLE;
          measure();
        }
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const maxX = Math.max(0, box.w - box.nw);
      const maxY = Math.max(0, box.h - box.nh);
      // The path keeps bending a little, so it is never a straight line to follow.
      heading += 0.45 * dt * Math.sin(now / 1700);
      let vx = Math.cos(heading) * speed;
      let vy = Math.sin(heading) * speed;
      x += vx * dt;
      y += vy * dt;
      if (x <= 0) { x = 0; vx = Math.abs(vx); } else if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y <= 0) { y = 0; vy = Math.abs(vy); } else if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
      heading = Math.atan2(vy, vx);
      node.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      guard.takeRecords(); // our own move is not tampering
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      stopped = true;
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
  return <Mark text={text} config={MARK} />;
}
