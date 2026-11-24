import { useEffect, useLayoutEffect, useRef } from "react";

// A faint line with the student's name and the last four digits of their phone, drifting to a new
// spot every few seconds. If the page's own code or devtools remove or restyle it, it puts itself back.
// It is a deterrent: it makes a recording traceable to an account, it cannot stop recording.
const SPOTS = [
  { top: "12%", left: "8%" },
  { top: "22%", left: "52%" },
  { top: "46%", left: "20%" },
  { top: "40%", left: "58%" },
  { top: "68%", left: "10%" },
  { top: "74%", left: "48%" },
  { top: "58%", left: "36%" },
  { top: "16%", left: "30%" },
];

function watermarkText(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const last4 = String(user?.contactNumber || "").replace(/\D/g, "").slice(-4);
  const tail = last4 ? `•••• ${last4}` : String(user?.email || "").split("@")[0];
  return [name, tail].filter(Boolean).join("  ·  ") || "Kanthast";
}

const BASE_STYLE =
  "position:absolute;z-index:5;pointer-events:none;user-select:none;white-space:nowrap;" +
  "font:600 13px/1 Hind,system-ui,sans-serif;color:#fff;opacity:.28;text-shadow:0 1px 2px rgba(0,0,0,.55);" +
  "transition:top 1.6s cubic-bezier(.22,1,.36,1),left 1.6s cubic-bezier(.22,1,.36,1);";

export default function SecureWatermark({ user }) {
  const ref = useRef(null);
  const text = watermarkText(user);

  // Set before first paint so it never flashes unstyled. (Not via the style prop: React rejects cssText.)
  useLayoutEffect(() => {
    if (ref.current) ref.current.style.cssText = BASE_STYLE;
  }, []);

  useEffect(() => {
    const node = ref.current;
    const parent = node?.parentElement;
    if (!node || !parent) return undefined;

    let spot = Math.floor(Math.random() * SPOTS.length);
    const place = () => {
      spot = (spot + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length;
      node.style.top = SPOTS[spot].top;
      node.style.left = SPOTS[spot].left;
    };
    place();
    const timer = setInterval(place, 7000);

    // Put it back if it is removed, hidden or made see-through. The check looks at how it renders, not at
    // the style text (browsers rewrite that text), and only repairs when something is actually wrong, so
    // the repair cannot trigger itself.
    const tampered = () => {
      const css = getComputedStyle(node);
      return css.display === "none" || css.visibility === "hidden" || css.position !== "absolute" || Number(css.opacity) < 0.15 || node.hidden;
    };
    const guard = new MutationObserver(() => {
      if (!parent.contains(node)) parent.appendChild(node);
      if (tampered()) {
        const top = node.style.top;
        const left = node.style.left;
        node.hidden = false;
        node.style.cssText = BASE_STYLE;
        node.style.top = top;
        node.style.left = left;
      }
    });
    guard.observe(parent, { childList: true });
    guard.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    return () => {
      clearInterval(timer);
      guard.disconnect();
    };
  }, [text]);

  return <span ref={ref} aria-hidden="true" data-watermark>{text}</span>;
}
