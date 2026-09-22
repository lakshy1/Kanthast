import { forwardRef, useId, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * The single text-input primitive.
 *
 * Replaces the 5 incompatible input styles the audit found, and fixes the
 * accessibility gaps they shared:
 *   - a real <label> bound with htmlFor/id (not placeholder-only)
 *   - aria-invalid + aria-describedby tying the error text to the control
 *   - role="alert" so the error is announced, not just painted red
 *   - a 44px-min target and the global focus ring
 *
 * Password fields get a properly labelled 44px visibility toggle, replacing
 * the ~16px unlabelled icon on the login path.
 */
const Field = forwardRef(function Field(
  {
    label,
    id,
    type = "text",
    error,
    hint,
    className = "",
    containerClassName = "",
    required = false,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const fieldId = id || `field-${autoId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && (
            <span className="ml-1 text-critical" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type={resolvedType}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy || undefined}
          className={`field ${error ? "field-error" : ""} ${
            isPassword ? "pr-14" : ""
          } ${className}`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="btn-icon absolute right-0 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
          >
            {revealed ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
});

export default Field;
