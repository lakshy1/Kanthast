import { useState } from "react";
import { FaArrowRight, FaCircleCheck } from "react-icons/fa6";

const INTERESTS = [
  { value: "professional", label: "Professional" },
  { value: "school", label: "School" },
  { value: "both", label: "Both" },
];

/** "Join the waitlist": the one action on the Kanthast home page. Emails go to our own database. */
export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("both");
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [honey, setHoney] = useState(""); // bots fill this; people never see it

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
        body: JSON.stringify({ email: email.trim(), interest }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Could not save your email. Please try again.");
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Could not save your email. Please try again.");
    }
  };

  return (
    <section id="waitlist" aria-labelledby="waitlist-heading" className="kx-section">
      <div className="kx-panel mx-auto max-w-[720px] text-center">
        <h2 id="waitlist-heading" className="text-3xl font-bold text-[var(--bh-ink)] md:text-4xl">Join the waitlist</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-[var(--bh-muted,#4b5a75)]">
          First lessons open on 1 December 2026. Leave your email and we will tell you when your lessons are ready.
        </p>

        {status === "done" ? (
          <p role="status" className="mt-8 inline-flex items-center gap-2 text-lg font-semibold text-[var(--bh-ink)]">
            <FaCircleCheck aria-hidden="true" className="text-emerald-600" />
            You are on the list. Thank you.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8">
            <fieldset className="flex flex-wrap items-center justify-center gap-2">
              <legend className="sr-only">Which are you interested in?</legend>
              {INTERESTS.map((item) => (
                <label key={item.value} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${interest === item.value ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-[#c9d6f2] bg-white text-[var(--bh-ink)] hover:border-[#1d4ed8]"}`}>
                  <input type="radio" name="interest" value={item.value} checked={interest === item.value} onChange={() => setInterest(item.value)} className="sr-only" />
                  {item.label}
                </label>
              ))}
            </fieldset>

            <div className="mx-auto mt-4 flex max-w-[520px] flex-col gap-3 sm:flex-row">
              <label htmlFor="waitlist-email" className="sr-only">Email address</label>
              <input
                id="waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "waitlist-error" : undefined}
                className="min-h-[48px] flex-1 rounded-full border border-[#c9d6f2] bg-white px-5 text-base text-[var(--bh-ink)] outline-none focus-visible:border-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
              />
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" name="website" />
              <button type="submit" disabled={status === "sending"} className="bh-btn bh-btn-primary disabled:opacity-60">
                {status === "sending" ? "Joining..." : "Join the waitlist"}
                <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
              </button>
            </div>
            {error && <p id="waitlist-error" role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
            <p className="mt-4 text-xs text-[#6b7a94]">We only use your email to tell you when lessons open. No spam.</p>
          </form>
        )}
      </div>
    </section>
  );
}
