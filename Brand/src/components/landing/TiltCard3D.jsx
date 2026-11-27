import { useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * Interactive 3D perspective card with spring-physics cursor tilt and a subtle radial spotlight.
 * Respects `prefers-reduced-motion` by falling back to a flat card.
 */
export default function TiltCard3D({ as = "div", className = "", spotlightColor = "rgba(37, 99, 235, 0.12)", children, ...props }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);

  const [spot, setSpot] = useState({ x: "50%", y: "50%" });

  const handleMove = (e) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mouseX.set(Math.max(0, Math.min(1, px)));
    mouseY.set(Math.max(0, Math.min(1, py)));
    setSpot({ x: `${Math.round(px * 100)}%`, y: `${Math.round(py * 100)}%` });
  };

  const handleLeave = () => {
    setHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const Component = as === "a" ? motion.a : motion.div;

  return (
    <div style={{ perspective: "1200px" }}>
      <Component
        ref={ref}
        onMouseEnter={() => !reduce && setHovered(true)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={
          reduce
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
        }
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        {!reduce && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(460px circle at ${spot.x} ${spot.y}, ${spotlightColor}, transparent 65%)`,
            }}
          />
        )}
        {children}
      </Component>
    </div>
  );
}
