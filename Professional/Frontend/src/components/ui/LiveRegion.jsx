/**
 * Visually-hidden live region.
 *
 * The audit found zero aria-live regions in the product: no error, success,
 * upload or chat message was ever announced. Wrap any dynamic status text in
 * this so assistive tech hears it without changing the visual design.
 *
 * `polite` waits for a pause (status, results). `assertive` interrupts
 * (errors that block the user).
 */
export default function LiveRegion({ message, politeness = "polite" }) {
  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
