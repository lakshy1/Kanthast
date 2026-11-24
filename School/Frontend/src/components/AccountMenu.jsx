import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaUserCircle, FaCog, FaSignOutAlt, FaCrown } from "react-icons/fa";

const AVATAR_COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];

const itemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:bg-slate-50";

/**
 * The signed-in account menu, used by both the desktop and the mobile bar.
 * Opens on click or keyboard only (hover-to-open used to fight the click that
 * toggles it). Escape closes it and returns focus to the button.
 */
export default function AccountMenu({ user, hasSubscription, onLogout, wide = true }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarBg = AVATAR_COLORS[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
  const validTill = user?.subscriptionValidTill ? new Date(user.subscriptionValidTill) : null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  // The bar hides itself while scrolling down on phones; take the menu with it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  const closeAndFocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) closeAndFocus();
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex min-h-touch items-center gap-1.5 rounded-full border border-slate-300/70 bg-white/60 px-2 py-1 transition hover:bg-white/90"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarBg }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <FaChevronDown
          aria-hidden="true"
          className={`text-micro text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 z-50 mt-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-black/15 ${
              wide ? "w-60" : "w-56"
            }`}
          >
            <div className="mb-1 border-b border-slate-100 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
              {hasSubscription ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <FaCrown aria-hidden="true" className="shrink-0 text-micro text-amber-400" />
                  <span className="text-micro font-semibold text-emerald-600">Plan active</span>
                  {validTill && !Number.isNaN(validTill.getTime()) && (
                    <>
                      <span aria-hidden="true" className="text-micro text-ink-subtle">·</span>
                      <span className="text-micro text-ink-subtle">
                        Till{" "}
                        {validTill.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span className="text-micro text-ink-subtle">No active plan</span>
                </div>
              )}
            </div>
            <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className={itemClass}>
              <FaUserCircle aria-hidden="true" className="text-xs text-ink-subtle" /> My Profile
            </Link>
            <Link role="menuitem" to="/settings" onClick={() => setOpen(false)} className={itemClass}>
              <FaCog aria-hidden="true" className="text-xs text-ink-subtle" /> Settings
            </Link>
            {!hasSubscription && (
              <Link role="menuitem" to="/subscription" onClick={() => setOpen(false)} className={itemClass}>
                <FaCrown aria-hidden="true" className="text-xs text-amber-400" /> Subscription
              </Link>
            )}
            <div role="separator" className="my-1 border-t border-slate-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 focus-visible:bg-red-50"
            >
              <FaSignOutAlt aria-hidden="true" className="text-xs" /> Logout
            </button>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
