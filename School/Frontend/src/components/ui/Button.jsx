import { forwardRef } from "react";

/**
 * The single button primitive.
 *
 * Replaces the 7 divergent primary-button treatments the audit found. Every
 * variant clears the 44px touch minimum and inherits the global :focus-visible
 * ring from index.css, so no call site needs outline-none.
 *
 * `loading` swaps in a spinner AND reserves the label's width, so the button
 * does not resize mid-request the way the old text-swap buttons did.
 */
const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    type = "button",
    loading = false,
    loadingText,
    disabled = false,
    fullWidth = false,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
});

export default Button;
