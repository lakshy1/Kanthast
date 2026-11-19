import { useCallback, useEffect, useId, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FaXmark } from "react-icons/fa6";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Open dialogs, oldest first. Keyboard and focus handling belong to the last one.
const openStack = [];

// The controls Tab can reach right now: matched by FOCUSABLE, rendered (an
// element with no boxes, such as display:none, cannot take focus), and not
// inside an inert subtree. Ordered as the document orders them.
function tabbables(panel) {
  return Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert]") && getComputedStyle(el).visibility !== "hidden"
  );
}

// Where Tab (or Shift+Tab) goes from `current`. Every Tab inside the dialog is
// routed here rather than left to the browser, so focus can only ever move
// between the dialog's own controls.
function nextTabStop(panel, current, backwards) {
  const nodes = tabbables(panel);
  if (!nodes.length) return panel;
  const index = nodes.indexOf(current);
  if (index !== -1) {
    return nodes[(index + (backwards ? -1 : 1) + nodes.length) % nodes.length];
  }
  // Focus is outside the dialog, on <body>, or on the panel itself.
  if (!current || current === panel || !panel.contains(current)) {
    return backwards ? nodes[nodes.length - 1] : nodes[0];
  }
  // Focus is on something inside that Tab does not stop at (an error message
  // focused with tabIndex -1): continue from where it sits in the document.
  const following = nodes.filter((el) => current.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const preceding = nodes.filter((el) => current.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
  if (backwards) return preceding[preceding.length - 1] || nodes[nodes.length - 1];
  return following[0] || nodes[0];
}

/**
 * Accessible modal dialog.
 *
 * The audit found no modal in the product was a real dialog: the payment
 * modal, AI Video Creator and Chatbot drawer had no role="dialog", no focus
 * trap, no Escape handler and no focus restoration, so Tab walked straight out
 * of the payment form into the page behind the scrim.
 *
 * This implements the full contract:
 *   - role="dialog" + aria-modal + aria-labelledby
 *   - Escape to close (heard at document level, top-most dialog only)
 *   - focus moves in on open, cycles inside, and returns to the trigger
 *     (Tab is always routed by the dialog, and focus that lands outside it
 *     some other way is pulled back in)
 *   - background scroll locked while open
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel = "Close dialog",
}) {
  const panelRef = useRef(null);
  // A stable callback ref that ignores detach. AnimatePresence keeps a closing
  // panel mounted for its exit animation; when the dialog reopens before that
  // finishes, the old panel can unmount after the new one mounted, and a plain
  // ref would then be set to null, switching the focus trap off while open.
  const setPanel = useCallback((node) => {
    if (node) panelRef.current = node;
  }, []);
  const previouslyFocused = useRef(null);
  const autoId = useId();
  const titleId = `modal-title-${autoId}`;
  const descId = `modal-desc-${autoId}`;

  // Keep the latest onClose without re-binding the document listener.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const token = {};
    openStack.push(token);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const isTop = () => openStack[openStack.length - 1] === token;

    // Focus the first control inside the dialog, else the panel itself.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      (tabbables(panel)[0] || panel).focus();
    });

    // Listen on the document, not the panel: focus can drop to <body> (after a
    // Select option is chosen, or when the focused button becomes disabled),
    // and a panel-only handler then never sees Escape or Tab. Only the top-most
    // open dialog responds.
    const onKeyDown = (event) => {
      if (!isTop()) return;
      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === "Escape") {
        // A control inside (an open Select menu) already used this Escape.
        if (event.defaultPrevented) return;
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || event.defaultPrevented) return;

      // Move focus ourselves on every Tab, including from <body> or the panel.
      event.preventDefault();
      nextTabStop(panel, document.activeElement, event.shiftKey).focus();
    };
    document.addEventListener("keydown", onKeyDown);

    // Backstop for anything that moves focus without Tab (a script, a click on
    // something behind the scrim that still takes focus): pull it back inside.
    // A Select menu renders in a portal marked data-modal-portal and counts as inside.
    const onFocusIn = (event) => {
      if (!isTop()) return;
      const panel = panelRef.current;
      const target = event.target;
      if (!panel || panel.contains(target)) return;
      if (target instanceof Element && target.closest("[data-modal-portal]")) return;
      (tabbables(panel)[0] || panel).focus();
    };
    document.addEventListener("focusin", onFocusIn);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      const index = openStack.indexOf(token);
      if (index !== -1) openStack.splice(index, 1);
      document.body.style.overflow = overflow;
      // Return focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const maxW =
    { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size] ||
    "max-w-xl";

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            // Only a click that both starts and ends on the scrim dismisses.
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <Motion.div
            ref={setPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className={`card w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-sheet shadow-e5 focus:outline-none`}
          >
            {(title || onClose) && (
              <div className="flex items-start gap-4 border-b border-line px-6 py-4">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="text-lg font-bold text-ink">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-1 text-sm text-ink-muted">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="btn-icon -mr-2 shrink-0 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="px-6 py-5">{children}</div>

            {footer && (
              <div className="border-t border-line px-6 py-4">{footer}</div>
            )}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
