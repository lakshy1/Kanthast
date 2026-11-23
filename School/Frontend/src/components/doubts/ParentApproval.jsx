import { useEffect, useState } from "react";
import { Button, Field } from "../ui";
import { getConsent, requestConsent, verifyConsent, withdrawConsent } from "../../utils/doubtsApi";

/**
 * Parent approval for Doubts. Used as the gate before the class feed and in Settings.
 * `onApproved` runs when the status becomes approved.
 */
export default function ParentApproval({ onApproved, compact = false }) {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [code, setCode] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    let alive = true;
    getConsent()
      .then((data) => alive && setConsent(data.consent))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const run = async (action, after) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await action();
      setConsent(data.consent);
      after?.(data.consent);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event) => {
    event.preventDefault();
    run(
      () => requestConsent(parentName.trim(), parentEmail.trim()),
      () => setNotice("We sent a 6-digit code to your parent's email. Ask them for it.")
    );
  };
  const submitCode = (event) => {
    event.preventDefault();
    run(
      () => verifyConsent(code.trim()),
      (next) => {
        setCode("");
        if (next.status === "approved") onApproved?.();
      }
    );
  };

  if (loading) return <p className="text-sm text-ink-subtle">Checking parent approval…</p>;

  const status = consent?.status || "none";
  const message = (
    <>
      {error && (
        <p role="alert" className="rounded-control bg-critical-soft px-4 py-3 text-sm text-critical">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-control bg-positive-soft px-4 py-3 text-sm text-positive">
          {notice}
        </p>
      )}
    </>
  );

  if (status === "approved") {
    return (
      <div className="space-y-3">
        <p className="text-ink">
          <span className="font-semibold">Approved</span> by {consent.parentName} ({consent.parentEmail})
          {consent.approvedAt
            ? ` on ${new Date(consent.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
            : ""}
          .
        </p>
        {message}
        {confirmWithdraw ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-muted">Withdrawing locks the class feed until a parent approves again.</p>
            <Button variant="danger" loading={busy} onClick={() => run(withdrawConsent, () => setConfirmWithdraw(false))}>
              Withdraw approval
            </Button>
            <Button variant="ghost" onClick={() => setConfirmWithdraw(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>
            Withdraw approval
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="space-y-2 text-ink-muted">
          <p>
            In Doubts you post study questions that classmates in your class can read and answer. Before you can use the
            class feed, a parent or guardian must approve.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Classmates see your first name and class only. There are no private messages.</li>
            <li>Every post is checked before it is shown.</li>
            <li>Your parent can withdraw approval at any time in Settings.</li>
          </ul>
        </div>
      )}
      {status === "withdrawn" && <p className="text-sm text-caution">Approval was withdrawn. Ask your parent to approve again.</p>}
      {message}

      <form onSubmit={sendCode} className="grid gap-4 sm:grid-cols-2">
        <Field
          id="consent-parent-name"
          label="Parent or guardian's name"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          autoComplete="off"
          required
        />
        <Field
          id="consent-parent-email"
          label="Their email address"
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          hint="Not the email on your own account."
          autoComplete="off"
          required
        />
        <div className="sm:col-span-2">
          <Button type="submit" variant={status === "pending" ? "secondary" : "primary"} loading={busy}>
            {status === "pending" ? "Send a new code" : "Send code to my parent"}
          </Button>
        </div>
      </form>

      {status === "pending" && (
        <form onSubmit={submitCode} className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
          <Field
            id="consent-code"
            label={`Code sent to ${consent.parentEmail}`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 digits"
            containerClassName="w-56"
            required
          />
          <Button type="submit" loading={busy} disabled={code.length !== 6}>
            Approve
          </Button>
        </form>
      )}
    </div>
  );
}
