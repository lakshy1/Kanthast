import { useCallback, useEffect, useId, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FaXmark } from "react-icons/fa6";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
 *   - Escape to close
 *   - focus moves in on open, cycles inside, and returns to the trigger
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
  const previouslyFocused = useRef(null);
  const autoId = useId();
  const titleId = `modal-title-${autoId}`;
  const descId = `modal-desc-${autoId}`;

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      // Wrap focus so it can never escape the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the first control inside the dialog, else the panel itself.
    const raf = requestAnimationFrame(() => {
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      (nodes?.length ? nodes[0] : panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
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
