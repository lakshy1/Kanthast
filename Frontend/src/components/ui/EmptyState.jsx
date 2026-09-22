import Button from "./Button";

/**
 * Designed empty / error state.
 *
 * The audit found the main product's empty states were bare strings — and in
 * one case a literal `null`, rendering an empty white box. It also found that
 * catch blocks fell through to the same empty state, so "server is down" and
 * "nothing here yet" looked identical with no retry anywhere.
 *
 * `variant="error"` gives failures their own treatment plus a retry action.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
  variant = "empty",
}) {
  const isError = variant === "error";

  return (
    <div
      className="card flex flex-col items-center justify-center rounded-card px-6 py-12 text-center"
      role={isError ? "alert" : undefined}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className={`mb-4 grid h-14 w-14 place-items-center rounded-full text-xl
                      ${isError ? "bg-critical-soft text-critical" : "bg-brand-soft text-brand"}`}
        >
          <Icon />
        </span>
      )}

      <h3 className="text-lg font-bold text-ink">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}

      {action && onAction && (
        <Button
          variant={isError ? "secondary" : "primary"}
          onClick={onAction}
          className="mt-6"
        >
          {action}
        </Button>
      )}
    </div>
  );
}
