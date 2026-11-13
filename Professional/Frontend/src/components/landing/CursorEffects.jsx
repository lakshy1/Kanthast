import { useEffect, useRef, useState } from "react";
import { motion as Motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// Cursor-aware moments for the marketing pages only. The system cursor is
// never replaced; these react to it. Pointer-driven ones run for mouse and
// trackpad users only, and all of them stand down under reduced motion.

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return fine;
}

/**
 * The hero's blue bloom, drifting toward the cursor while it is over the
 * hero and easing back to rest when it leaves.
 */
export function HeroGlow({ className = "", range = { x: 140, y: 90 } }) {
  const ref = useRef(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const x = useSpring(tx, { stiffness: 60, damping: 18, mass: 0.8 });
  const y = useSpring(ty, { stiffness: 60, damping: 18, mass: 0.8 });

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section || !fine || reduce) return undefined;
    const onMove = (event) => {
      const box = section.getBoundingClientRect();
      const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
      const ny = ((event.clientY - box.top) / box.height) * 2 - 1;
      tx.set(nx * range.x);
      ty.set(ny * range.y);
    };
    const onLeave = () => {
      tx.set(0);
      ty.set(0);
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce, range.x, range.y, tx, ty]);

  return <Motion.div ref={ref} aria-hidden="true" className={className} style={{ x, y }} />;
}

/**
 * Tilts its child a few degrees toward the cursor, as if the device were
 * held up to it. Rests flat when the pointer leaves the containing section.
 */
export function TiltFrame({ children, max = 6, className = "" }) {
  const ref = useRef(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 90, damping: 16 });
  const rotateY = useSpring(ry, { stiffness: 90, damping: 16 });

  useEffect(() => {
    const el = ref.current;
    const section = el?.closest("section");
    if (!el || !section || !fine || reduce) return undefined;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const onMove = (event) => {
      const box = el.getBoundingClientRect();
      const nx = clamp((event.clientX - (box.left + box.width / 2)) / (box.width * 0.75));
      const ny = clamp((event.clientY - (box.top + box.height / 2)) / (box.height * 0.9));
      ry.set(nx * max);
      rx.set(-ny * max * 0.7);
    };
    const onLeave = () => {
      rx.set(0);
      ry.set(0);
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce, max, rx, ry]);

  return (
    <div className={className} style={{ perspective: 1400 }}>
      <Motion.div ref={ref} style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {children}
      </Motion.div>
    </div>
  );
}
