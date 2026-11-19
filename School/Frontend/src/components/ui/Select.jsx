import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronDown, FaCheck } from "react-icons/fa";

// Tallest the menu gets, and the room kept between it and the trigger / screen edge.
const MENU_MAX = 368; // room for 8 options (44px each) before the menu scrolls
const GAP = 6;
const EDGE = 8;

/**
 * Accessible listbox select.
 *
 * Replaces the two near-identical CustomSelect copies (Settings.jsx and
 * Profile.jsx, ~50 lines each) that the audit found. Those copies had:
 *   - no role/aria-expanded/aria-selected, so they announced as plain buttons
 *   - no keyboard handling at all (no Escape, arrows, Home/End, Enter)
 *   - mousedown-only dismissal, so tabbing away left the menu open
 *   - different heights (44px in Settings, 36px in Profile)
 *
 * Because a <label> cannot name a <button>, the trigger takes an explicit
 * aria-labelledby pointing at the rendered label.
 *
 * The menu renders in a portal on <body>, fixed to the trigger's rectangle, so
 * a dialog's scrolling panel (Modal uses overflow-y-auto) can never clip it.
 * It opens below the trigger, or above when there is more room there, and its
 * height is capped to the space available. Focus never leaves the trigger:
 * the menu swallows mousedown, so keyboard handling, Escape and the dialog's
 * focus trap all keep working exactly as before.
 */
export default function Select({
  value,
  onChange,
  options = [],
  label,
  id,
  disabled = false,
  placeholder = "Select…",
  triggerClassName = "",
}) {
  const autoId = useId();
  const selectId = id || `select-${autoId}`;
  const labelId = `${selectId}-label`;
  const listboxId = `${selectId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [place, setPlace] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const selectedIndex = items.findIndex((o) => o.value === value);
  const selected = items[selectedIndex];
  const itemCount = items.length;

  // Where the menu goes, from the trigger's rectangle in the viewport.
  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const viewport = window.innerHeight;
    const below = viewport - rect.bottom - GAP - EDGE;
    const above = rect.top - GAP - EDGE;
    // 44px rows plus the list's 4px top and bottom padding.
    const wanted = Math.min(MENU_MAX, itemCount * 44 + 8);
    const up = below < wanted && above > below;
    const maxHeight = Math.max(Math.min(MENU_MAX, up ? above : below), 88);
    return {
      left: rect.left,
      width: rect.width,
      maxHeight,
      ...(up ? { bottom: viewport - rect.top + GAP } : { top: rect.bottom + GAP }),
      offscreen: rect.bottom < 0 || rect.top > viewport,
    };
  }, [itemCount]);

  // Dismiss on an outside pointer OR focus leaving the widget (the old copies
  // listened for mousedown only, so keyboard users stranded an open menu).
  // The menu lives in a portal, so "inside" is the trigger's wrapper or the menu.
  // Scrolling or resizing moves the menu with its trigger; once the trigger
  // scrolls out of view the menu closes.
  useEffect(() => {
    if (!open) return undefined;
    const inside = (target) =>
      wrapRef.current?.contains(target) || listRef.current?.contains(target);
    const onPointer = (e) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onFocusIn = (e) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onMove = (e) => {
      // Scrolling the menu itself is not a reason to move it.
      if (e?.type === "scroll" && listRef.current?.contains(e.target)) return;
      const next = measure();
      if (!next || next.offscreen) setOpen(false);
      else setPlace(next);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, measure]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  // Open the menu with the current value highlighted. Done here rather than in
  // an effect so it is a single render, not a cascading one.
  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setPlace(measure());
    setOpen(true);
  };

  const commit = (index) => {
    const item = items[index];
    if (!item) return;
    onChange?.(item.value);
    setOpen(false);
    // Focus stays on the trigger (the menu never takes it); make sure of it so
    // Tab and Escape keep working after a mouse pick.
    triggerRef.current?.focus();
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "Escape":
        if (open) {
          // preventDefault tells an enclosing Modal this Escape was used.
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(items.length - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openMenu();
        else commit(activeIndex);
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      default:
        break;
    }
  };

  const optionId = (index) => `${selectId}-option-${index}`;
  const showMenu = open && place;

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <span id={labelId} className="label">
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={showMenu && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-labelledby={label ? `${labelId} ${selectId}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`field flex items-center justify-between text-left
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${open ? "border-brand" : ""} ${triggerClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? "text-ink" : "text-ink-subtle"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown
          aria-hidden="true"
          className={`ml-2 shrink-0 text-xs text-ink-subtle transition-transform duration-fast ease-brand ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {showMenu &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            // Marks this as part of the open dialog for Modal's focus guard.
            data-modal-portal=""
            // Keep focus on the trigger when the menu is clicked or scrolled.
            onMouseDown={(event) => event.preventDefault()}
            style={{
              position: "fixed",
              left: place.left,
              width: place.width,
              top: place.top,
              bottom: place.bottom,
              maxHeight: place.maxHeight,
            }}
            className="z-[110] overflow-y-auto overscroll-contain rounded-control
                       border border-line bg-surface-raised py-1 text-left shadow-e4"
          >
            {items.map((item, index) => {
              const isSelected = item.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                  className={`flex cursor-pointer items-center justify-between gap-2
                              px-4 py-2.5 text-sm min-h-touch
                              ${isActive ? "bg-surface-sunken" : ""}
                              ${isSelected ? "font-semibold text-ink" : "text-ink-muted"}`}
                >
                  <span>{item.label}</span>
                  {isSelected && (
                    <FaCheck aria-hidden="true" className="shrink-0 text-xs text-brand" />
                  )}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
