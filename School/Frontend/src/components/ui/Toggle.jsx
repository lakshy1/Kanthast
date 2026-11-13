import { useId } from "react";

/**
 * Accessible switch.
 *
 * The audit found SettingToggle used 10 times with no role="switch" and no
 * aria-checked — on/off was conveyed only by knob position and background
 * color, so screen readers announced "button" and the state was invisible to
 * assistive tech and to colorblind users alike.
 *
 * role="switch" + aria-checked makes the state readable; the knob also carries
 * a check/dash glyph so state survives without color.
 */
export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) {
  const autoId = useId();
  const switchId = id || `toggle-${autoId}`;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={switchId}
          className="block cursor-pointer text-sm font-semibold text-ink"
        >
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 text-sm text-ink-subtle">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full
                    transition-colors duration-fast ease-brand
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${checked ? "bg-brand" : "bg-line-strong"}`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white
                      text-micro font-bold text-ink shadow-e1
                      transition-transform duration-fast ease-brand
                      ${checked ? "translate-x-6" : "translate-x-1"}`}
          aria-hidden="true"
        >
          {checked ? "✓" : ""}
        </span>
      </button>
    </div>
  );
}
