import { useEffect, useId, useRef, useState } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";

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
 */
export default function Select({
  value,
  onChange,
  options = [],
  label,
  id,
  disabled = false,
  placeholder = "Select…",
}) {
  const autoId = useId();
  const selectId = id || `select-${autoId}`;
  const labelId = `${selectId}-label`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);

  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const selectedIndex = items.findIndex((o) => o.value === value);
  const selected = items[selectedIndex];

  // Dismiss on outside pointer OR focus leaving the widget — the old copies
  // listened for mousedown only, so keyboard users stranded an open menu.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onFocusIn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  // Open the menu with the current value highlighted. Done here rather than in
  // an effect so it is a single render, not a cascading one.
  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (index) => {
    const item = items[index];
    if (!item) return;
    onChange?.(item.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "Escape":
        if (open) {
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
      default:
        break;
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <span id={labelId} className="label">
          {label}
        </span>
      )}

      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${selectId}-listbox`}
        aria-labelledby={label ? `${labelId} ${selectId}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`field flex items-center justify-between text-left
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${open ? "border-brand" : ""}`}
      >
        <span className={selected ? "text-ink" : "text-ink-subtle"}>
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown
          aria-hidden="true"
          className={`ml-2 shrink-0 text-xs text-ink-subtle transition-transform duration-fast ease-brand ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={`${selectId}-listbox`}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          tabIndex={-1}
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-control
                     border border-line bg-surface py-1 shadow-e4"
        >
          {items.map((item, index) => {
            const isSelected = item.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={item.value}
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
        </ul>
      )}
    </div>
  );
}
