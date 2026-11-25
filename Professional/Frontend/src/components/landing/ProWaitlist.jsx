import { useState } from "react";
import { FaArrowRight, FaCircleCheck } from "react-icons/fa6";

// Waitlist for Kanthast Professional. Emails go to the shared waitlist on kanthast.in
// (same endpoint the landing page uses), tagged "professional".
// In local dev this only works through the landing page's proxy (http://localhost:5170/professional/).
export default function ProWaitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [honey, setHoney] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (honey) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/school/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), interest: "professional" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Could not save your email. Please try again.");
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Could not save your email. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <p role="status" className="mt-8 inline-flex items-center gap-2 text-lg font-semibold text-ink">
        <FaCircleCheck aria-hidden="true" className="text-emerald-600" />
        You are on the list. Thank you.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="pro-waitlist-email" className="sr-only">Email address</label>
        <input
          id="pro-waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "pro-waitlist-error" : undefined}
          className="min-h-touch flex-1 rounded-full border border-line-strong bg-surface px-5 text-base text-ink outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" name="website" />
        <button type="submit" disabled={status === "sending"} className="btn-primary px-7 text-base disabled:opacity-60">
          {status === "sending" ? "Joining..." : "Join the waitlist"}
          <FaArrowRight aria-hidden="true" />
        </button>
      </div>
      {error && <p id="pro-waitlist-error" role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <p className="mt-3 text-sm text-ink-muted">We only use your email to tell you when lectures open. No spam.</p>
    </form>
  );
}
