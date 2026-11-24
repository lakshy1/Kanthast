import { useCallback, useEffect, useState } from "react";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { EmptyState } from "../ui";
import { getWaitlist } from "../../utils/adminVideoApi";

const LABEL = { professional: "Professional", school: "School", both: "Both" };

/** Admin: emails collected by the "Join the waitlist" form on the Kanthast home page. */
export default function WaitlistPanel() {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      setState({ loading: false, error: "", data: await getWaitlist() });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { loading, error, data } = state;
  const copy = () => navigator.clipboard?.writeText(data.entries.map((e) => e.email).join(", "));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-ink">Waitlist</h2>
      {loading && <p role="status" className="text-ink-muted">Loading...</p>}
      {error && <EmptyState variant="error" icon={FaEnvelopeOpenText} title="Could not load the waitlist" description={error} action="Try again" onAction={load} />}
      {data && data.total === 0 && <EmptyState icon={FaEnvelopeOpenText} title="No sign-ups yet" description="Emails from the Join the waitlist form on the Kanthast home page will appear here." />}
      {data && data.total > 0 && (
        <>
          <p className="text-ink">
            <strong className="tabular-nums">{data.total}</strong> sign-ups: {Object.entries(data.counts).map(([k, n]) => `${n} ${LABEL[k] || k}`).join(", ")}.{" "}
            <button type="button" onClick={copy} className="font-semibold text-brand underline-offset-4 hover:underline">Copy all emails</button>
          </p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-ink-muted"><tr><th className="p-3">Email</th><th className="p-3">Interested in</th><th className="p-3">Joined</th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="p-3 text-ink">{e.email}</td>
                    <td className="p-3">{LABEL[e.interest] || e.interest}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(e.joinedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
