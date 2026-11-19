import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheck, FaFlag, FaHistory, FaRedo, FaRobot, FaSync, FaTrash, FaUserSlash, FaVolumeUp } from "react-icons/fa";
import { toast } from "react-toastify";
import { Button, EmptyState, Modal, Select } from "../ui";
import {
  MUTE_OPTIONS,
  REPORT_REASON_LABELS,
  getModerationActions,
  getModerationCounts,
  getModerationItem,
  getModerationQueue,
  getStudentSummary,
  moderateItem,
  muteStudent,
  unmuteStudent,
} from "../../utils/adminDoubtsApi";
import { timeAgo } from "../../utils/doubtsApi";

// Doubts moderation inside the admin panel: the review queue with a detail panel, and the action log.
// Everything here is plain text from students; it is rendered as text, never as HTML.

const NOTE_MAX = 500;
const REASON_MIN = 3;
const REASON_MAX = 300;

const STATUS_BADGE = {
  live: { label: "Live", cls: "bg-positive-soft text-positive" },
  pending: { label: "Held", cls: "bg-caution-soft text-caution" },
  removed: { label: "Removed", cls: "bg-critical-soft text-critical" },
  deleted_by_author: { label: "Deleted by author", cls: "bg-surface-sunken text-ink-muted" },
};
const ACTION_LABEL = { approve: "Approved", remove: "Removed", restore: "Restored", mute: "Muted", unmute: "Unmuted" };
const ACTION_CLS = {
  approve: "bg-positive-soft text-positive",
  remove: "bg-critical-soft text-critical",
  restore: "bg-brand-soft text-brand",
  mute: "bg-caution-soft text-caution",
  unmute: "bg-surface-sunken text-ink-muted",
};
const CONFIRM = {
  approve: {
    title: "Approve this?",
    body: "It stays visible to the class (or comes back if it was hidden). Its open reports are dismissed. It is hidden again only after 3 new reports.",
    label: "Approve",
    variant: "primary",
  },
  remove: {
    title: "Remove this?",
    body: "It is hidden from every student. The author of a removed doubt sees it as “Removed by a moderator”. Open reports are upheld. You can restore it later.",
    label: "Remove",
    variant: "danger",
  },
  restore: {
    title: "Restore this?",
    body: "It becomes visible to the class again.",
    label: "Restore",
    variant: "primary",
  },
};

const reasonLabel = (reason) => REPORT_REASON_LABELS[reason] || reason;
const fullDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const shortDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const typeLabel = (item) => (item.type === "doubt" ? "Doubt" : item.isAI ? "AI answer" : "Reply");
const authorLabel = (author) => (author ? `${author.firstName || "Student"}${author.schoolClass ? ` · Class ${author.schoolClass}` : ""}` : "AI");

function useWide(query = "(min-width: 1024px)") {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return wide;
}

function Pill({ className = "", children }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

function StatusBadge({ status, autoHidden }) {
  const badge = STATUS_BADGE[status] || { label: status, cls: "bg-surface-sunken text-ink-muted" };
  return <Pill className={badge.cls}>{status === "pending" && autoHidden ? "Hidden by reports" : badge.label}</Pill>;
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl bg-surface-sunken p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
            value === option.value ? "bg-slate-900 text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span
              className={`min-w-[1.5rem] rounded-full px-1.5 text-center text-xs tabular-nums ${
                value === option.value ? "bg-white/20 text-white" : option.count > 0 ? "bg-critical text-white" : "bg-line text-ink-muted"
              }`}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Queue list ─────────────────────────────────────────────────────────────

function QueueRow({ item, selected, onSelect }) {
  const top = item.reasons?.[0];
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-current={selected ? "true" : undefined}
        className={`w-full rounded-2xl border p-4 text-left transition ${
          selected ? "border-slate-900 bg-surface shadow-e3 ring-1 ring-slate-900" : "border-line bg-surface hover:border-line-strong"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Pill className="bg-slate-900 text-white">
            {item.isAI && <FaRobot aria-hidden="true" />}
            {typeLabel(item)}
          </Pill>
          <span className="font-semibold text-ink">Class {item.schoolClass || "–"}</span>
          <span className="text-ink-muted">{item.subject}</span>
          <span className="ml-auto">
            <StatusBadge status={item.status} autoHidden={item.autoHidden} />
          </span>
        </div>
        {item.type === "reply" && item.parent && (
          <p className="mt-2 truncate text-xs text-ink-subtle">On: {item.parent.title}</p>
        )}
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink">{item.excerpt}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          {item.openReports > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-critical">
              <FaFlag aria-hidden="true" /> {item.openReports} open {item.openReports === 1 ? "report" : "reports"}
            </span>
          ) : item.totalReports > 0 ? (
            <span>
              {item.totalReports} {item.totalReports === 1 ? "report" : "reports"}, resolved
            </span>
          ) : (
            <span>No reports</span>
          )}
          {top && (
            <span>
              {reasonLabel(top.reason)}
              {top.count > 1 ? ` ×${top.count}` : ""}
            </span>
          )}
          <span className="ml-auto" title={fullDate(item.sortAt || item.createdAt)}>
            {timeAgo(item.sortAt || item.createdAt)}
          </span>
        </div>
      </button>
    </li>
  );
}

// ─── Confirm dialogs ────────────────────────────────────────────────────────

function ConfirmAction({ pending, busy, onCancel, onConfirm }) {
  const [note, setNote] = useState("");
  const config = pending ? CONFIRM[pending.action] : null;
  return (
    <Modal
      open={Boolean(pending)}
      onClose={busy ? () => {} : onCancel}
      title={config?.title}
      description={pending ? `${typeLabel(pending.item)} by ${authorLabel(pending.item.author)}` : ""}
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={config?.variant} loading={busy} loadingText="Saving…" onClick={() => onConfirm(note.trim())}>
            {config?.label}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ink-muted">{config?.body}</p>
      <label htmlFor="moderation-note" className="label mt-4">
        Note for the log (optional)
      </label>
      <textarea
        id="moderation-note"
        className="field min-h-[96px] text-sm"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX}
        placeholder="Why you decided this. Only admins see it."
      />
      <p className="mt-1 text-right text-xs text-ink-subtle tabular-nums">
        {note.length}/{NOTE_MAX}
      </p>
    </Modal>
  );
}

function MuteDialog({ student, open, busy, onCancel, onConfirm }) {
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const valid = trimmed.length >= REASON_MIN && trimmed.length <= REASON_MAX;
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={`Mute ${student?.firstName || "this student"}?`}
      description="They can still read the class feed and use Ask AI, but can't post doubts, reply, or ask for an AI answer in a thread."
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            loadingText="Muting…"
            disabled={!valid}
            onClick={() => onConfirm(days === "permanent" ? "permanent" : Number(days), trimmed)}
          >
            Mute
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select id="mute-days" label="For how long" value={days} onChange={setDays} options={MUTE_OPTIONS} />
        <div>
          <label htmlFor="mute-reason" className="label">
            Reason (required)
          </label>
          <textarea
            id="mute-reason"
            className="field min-h-[96px] text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REASON_MAX}
            placeholder="What they did. Only admins see this."
          />
          <p className="mt-1 text-right text-xs text-ink-subtle tabular-nums">
            {reason.length}/{REASON_MAX}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Detail ─────────────────────────────────────────────────────────────────

function Section({ title, children, aside }) {
  return (
    <section className="border-t border-line pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ActionLine({ action }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <Pill className={ACTION_CLS[action.action]}>{ACTION_LABEL[action.action] || action.action}</Pill>
      <span className="text-ink">
        {action.targetType === "user" ? (
          action.action === "mute" ? (
            action.muteDays === "permanent" ? "until unmuted" : `for ${action.muteDays} ${action.muteDays === 1 ? "day" : "days"}`
          ) : (
            "the student"
          )
        ) : (
          <>
            {action.targetType === "doubt" ? "doubt" : "reply"}
            {action.targetLabel ? <span className="text-ink-muted"> “{action.targetLabel}”</span> : null}
          </>
        )}
      </span>
      <span className="text-xs text-ink-subtle" title={fullDate(action.createdAt)}>
        by {action.admin?.firstName || "Admin"} · {timeAgo(action.createdAt)}
      </span>
      {action.note && <p className="w-full whitespace-pre-wrap text-xs text-ink-muted">“{action.note}”</p>}
    </li>
  );
}

function StudentCard({ summary, loading, error, busy, onMute, onUnmute, onRetry }) {
  if (loading) return <p className="text-sm text-ink-muted">Loading student…</p>;
  if (error) {
    return (
      <p className="text-sm text-critical">
        {error}{" "}
        <button type="button" className="font-semibold underline" onClick={onRetry}>
          Try again
        </button>
      </p>
    );
  }
  if (!summary) return null;
  const { user, doubts, replies, removedCount, reports, mute } = summary;
  const canMute = user.role !== "admin";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-ink">{user.firstName}</span>
        <span className="text-sm text-ink-muted">{user.schoolClass ? `Class ${user.schoolClass}` : "No class"}</span>
        <span className="text-xs text-ink-subtle">ID {user.id}</span>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Doubts", doubts.total],
          ["Replies", replies.total],
          ["Removed", removedCount],
          ["Reports on them", reports.total],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface-sunken px-3 py-2">
            <dt className="text-xs text-ink-subtle">{label}</dt>
            <dd className="text-lg font-black tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-muted">
        Reports: {reports.open} open · {reports.upheld} upheld · {reports.dismissed} dismissed
      </p>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 ${
          mute.muted ? "border-caution/40 bg-caution-soft" : "border-line"
        }`}
      >
        <p className="min-w-0 flex-1 text-sm text-ink">
          {mute.muted ? (
            <>
              <span className="font-semibold">Muted {mute.permanent ? "until unmuted" : `until ${fullDate(mute.mutedUntil)}`}</span>
              {mute.mutedBy?.firstName ? <span className="text-ink-muted"> by {mute.mutedBy.firstName}</span> : null}
              {mute.reason && <span className="mt-0.5 block whitespace-pre-wrap text-xs text-ink-muted">“{mute.reason}”</span>}
            </>
          ) : (
            <span className="text-ink-muted">Can post normally.</span>
          )}
        </p>
        {canMute &&
          (mute.muted ? (
            <Button variant="secondary" className="min-h-[40px] px-4 py-2" onClick={onUnmute} disabled={busy}>
              <FaVolumeUp aria-hidden="true" className="inline" /> Unmute
            </Button>
          ) : (
            <Button variant="secondary" className="min-h-[40px] px-4 py-2" onClick={onMute} disabled={busy}>
              <FaUserSlash aria-hidden="true" className="inline" /> Mute
            </Button>
          ))}
      </div>
    </div>
  );
}

function ItemDetail({ itemKey, onChanged, onCountsChanged }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // { action, item }
  const [muteOpen, setMuteOpen] = useState(false);
  const [unmuteOpen, setUnmuteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  // Each opening of a dialog gets a fresh key, so its note / duration / reason start empty.
  const [dialogKey, setDialogKey] = useState(0);
  const live = useRef(0);

  const authorId = item?.author?.id || "";

  const load = useCallback(async () => {
    const id = ++live.current;
    setLoading(true);
    setError("");
    try {
      const data = await getModerationItem(itemKey.type, itemKey.id);
      if (id === live.current) setItem(data.item);
    } catch (err) {
      if (id === live.current) setError(err.message);
    } finally {
      if (id === live.current) setLoading(false);
    }
  }, [itemKey.type, itemKey.id]);

  const loadSummary = useCallback(async () => {
    if (!authorId) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const data = await getStudentSummary(authorId);
      setSummary(data);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [authorId]);

  useEffect(() => {
    setNotice("");
    load();
  }, [load]);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const afterWrite = async (message) => {
    setNotice(message);
    toast.success(message);
    await Promise.all([load(), loadSummary()]);
    onChanged?.();
    onCountsChanged?.();
  };
  const onWriteError = async (err) => {
    setNotice(err.message);
    toast.error(err.message);
    // Someone else may have acted: show what is true now.
    if (err.code === "conflict" || err.code === "invalid_state" || err.code === "not_muted") {
      await Promise.all([load(), loadSummary()]);
      onChanged?.();
      onCountsChanged?.();
    }
  };

  const runAction = async (note) => {
    const { action } = confirm;
    setBusy(true);
    try {
      const data = await moderateItem(itemKey.type, itemKey.id, action, note);
      setConfirm(null);
      if (data.item) setItem(data.item);
      await afterWrite(`${ACTION_LABEL[action]}.`);
    } catch (err) {
      setConfirm(null);
      await onWriteError(err);
    } finally {
      setBusy(false);
    }
  };
  const runMute = async (days, reason) => {
    setBusy(true);
    try {
      await muteStudent(authorId, days, reason);
      setMuteOpen(false);
      await afterWrite(`${item.author?.firstName || "Student"} is muted.`);
    } catch (err) {
      setMuteOpen(false);
      await onWriteError(err);
    } finally {
      setBusy(false);
    }
  };
  const runUnmute = async (note) => {
    setBusy(true);
    try {
      await unmuteStudent(authorId, note);
      setUnmuteOpen(false);
      await afterWrite(`${item.author?.firstName || "Student"} can post again.`);
    } catch (err) {
      setUnmuteOpen(false);
      await onWriteError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !item) return <p role="status" className="p-2 text-sm text-ink-muted">Loading…</p>;
  if (error && !item) {
    return <EmptyState variant="error" icon={FaFlag} title="Could not load this item" description={error} action="Try again" onAction={load} />;
  }
  if (!item) return null;

  const buttons = {
    approve: { label: "Approve", icon: FaCheck, variant: "primary" },
    remove: { label: "Remove", icon: FaTrash, variant: "danger" },
    restore: { label: "Restore", icon: FaRedo, variant: "secondary" },
  };
  const history = [...(item.actions || [])];
  const studentHistory = (summary?.actions || []).filter((a) => !(a.targetType === item.type && String(a.targetId) === String(item.id)));

  return (
    <div className="space-y-4" aria-busy={busy || loading || undefined}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Pill className="bg-slate-900 text-white">
          {item.isAI && <FaRobot aria-hidden="true" />}
          {typeLabel(item)}
        </Pill>
        <span className="font-semibold text-ink">Class {item.schoolClass || "–"}</span>
        <span className="text-ink-muted">
          {item.subject}
          {item.chapter ? ` · ${item.chapter}` : ""}
        </span>
        <span className="ml-auto">
          <StatusBadge status={item.status} autoHidden={item.autoHidden} />
        </span>
      </div>

      {item.type === "reply" && item.parent && (
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <p className="text-xs font-semibold text-ink-subtle">
            Reply to {authorLabel(item.parent.author)} ·{" "}
            <StatusBadge status={item.parent.status} />
          </p>
          <p className="mt-1 font-semibold text-ink">{item.parent.title}</p>
          {item.parent.body && <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-ink-muted">{item.parent.body}</p>}
        </div>
      )}

      <div>
        {item.title && <h3 className="text-lg font-bold leading-snug text-ink">{item.title}</h3>}
        {item.body && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{item.body}</p>}
        <p className="mt-2 text-xs text-ink-subtle">
          {authorLabel(item.author)} · posted <span title={fullDate(item.createdAt)}>{timeAgo(item.createdAt)}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.allowedActions.map((action) => {
          const b = buttons[action];
          const Icon = b.icon;
          return (
            <Button
              key={action}
              variant={b.variant}
              className="min-h-[44px] px-5 py-2"
              disabled={busy}
              onClick={() => {
                setDialogKey((k) => k + 1);
                setConfirm({ action, item });
              }}
            >
              <Icon aria-hidden="true" className="inline" /> {b.label}
            </Button>
          );
        })}
        {item.allowedActions.length === 0 && <p className="text-sm text-ink-muted">No action applies: the author deleted this.</p>}
        <Button variant="ghost" className="ml-auto min-h-[44px] px-4 py-2" onClick={load} disabled={busy || loading} aria-label="Refresh item">
          <FaSync aria-hidden="true" className="inline" />
        </Button>
      </div>
      {notice && (
        <p role="status" className="rounded-xl bg-surface-sunken px-3 py-2 text-sm text-ink">
          {notice}
        </p>
      )}

      <Section title={`Reports (${item.reports.length})`}>
        {item.reports.length === 0 ? (
          <p className="text-sm text-ink-muted">No reports. It is here because it is held for review.</p>
        ) : (
          <ul className="space-y-2">
            {item.reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-line px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-ink">{reasonLabel(r.reason)}</span>
                  <span className="text-ink-subtle">
                    by {r.reporter?.firstName || "a student"} · <span title={fullDate(r.createdAt)}>{timeAgo(r.createdAt)}</span>
                  </span>
                  <span className="ml-auto">
                    {r.status === "open" ? (
                      <Pill className="bg-critical-soft text-critical">Open</Pill>
                    ) : (
                      <Pill className="bg-surface-sunken text-ink-muted">{r.resolution === "upheld" ? "Upheld" : "Dismissed"}</Pill>
                    )}
                  </span>
                </div>
                {r.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-muted">“{r.note}”</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {item.author ? (
        <Section title="Author">
          <StudentCard
            summary={summary}
            loading={summaryLoading && !summary}
            error={summaryError}
            busy={busy}
            onMute={() => {
              setDialogKey((k) => k + 1);
              setMuteOpen(true);
            }}
            onUnmute={() => {
              setDialogKey((k) => k + 1);
              setUnmuteOpen(true);
            }}
            onRetry={loadSummary}
          />
        </Section>
      ) : (
        <Section title="Author">
          <p className="text-sm text-ink-muted">Written by the AI. Removing it lets the class ask the AI again.</p>
        </Section>
      )}

      <Section title="History of this item">
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No moderator has acted on this yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((a) => (
              <ActionLine key={a.id} action={a} />
            ))}
          </ul>
        )}
      </Section>
      {studentHistory.length > 0 && (
        <Section title="Earlier actions on this student">
          <ul className="space-y-2">
            {studentHistory.slice(0, 8).map((a) => (
              <ActionLine key={a.id} action={a} />
            ))}
          </ul>
        </Section>
      )}

      <ConfirmAction key={`c${dialogKey}`} pending={confirm} busy={busy} onCancel={() => setConfirm(null)} onConfirm={runAction} />
      <MuteDialog key={`m${dialogKey}`} student={item.author} open={muteOpen} busy={busy} onCancel={() => setMuteOpen(false)} onConfirm={runMute} />
      <UnmuteDialog key={`u${dialogKey}`} student={item.author} open={unmuteOpen} busy={busy} onCancel={() => setUnmuteOpen(false)} onConfirm={runUnmute} />
    </div>
  );
}

function UnmuteDialog({ student, open, busy, onCancel, onConfirm }) {
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={`Unmute ${student?.firstName || "this student"}?`}
      description="They can post doubts, reply and ask for AI answers again straight away."
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} loadingText="Saving…" onClick={() => onConfirm(note.trim())}>
            Unmute
          </Button>
        </div>
      }
    >
      <label htmlFor="unmute-note" className="label">
        Note for the log (optional)
      </label>
      <textarea
        id="unmute-note"
        className="field min-h-[96px] text-sm"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX}
      />
    </Modal>
  );
}

// ─── Queue view ─────────────────────────────────────────────────────────────

function QueueView({ openCount, refreshCounts }) {
  const wide = useWide();
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("");
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // { type, id }
  // Which filters the list on screen belongs to: after switching, the old list is never shown.
  const [loadedKey, setLoadedKey] = useState("");
  const currentKey = `${status}|${type}`;
  const requestId = useRef(0);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++requestId.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const data = await getModerationQueue({ status, type });
        if (id !== requestId.current) return;
        setItems(data.items || []);
        setNextCursor(data.nextCursor || null);
        setLoadedKey(`${status}|${type}`);
      } catch (err) {
        if (id === requestId.current) {
          setError(err.message);
          setLoadedKey(`${status}|${type}`);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [status, type]
  );

  useEffect(() => {
    setSelected(null);
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getModerationQueue({ status, type, cursor: nextCursor });
      setItems((prev) => {
        const seen = new Set(prev.map((x) => `${x.type}:${x.id}`));
        return [...prev, ...(data.items || []).filter((x) => !seen.has(`${x.type}:${x.id}`))];
      });
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshAll = () => {
    load({ quiet: true });
    refreshCounts();
  };

  const detail = selected ? (
    <ItemDetail key={`${selected.type}:${selected.id}`} itemKey={selected} onChanged={() => load({ quiet: true })} onCountsChanged={refreshCounts} />
  ) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          label="Queue"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: "Open", count: openCount },
            { value: "resolved", label: "Resolved" },
          ]}
        />
        <Segmented
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: "", label: "All" },
            { value: "doubt", label: "Doubts" },
            { value: "reply", label: "Replies" },
          ]}
        />
        <Button variant="secondary" className="ml-auto min-h-[40px] px-4 py-2" onClick={refreshAll} disabled={loading}>
          <FaSync aria-hidden="true" className="inline" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0">
          {loading || loadedKey !== currentKey ? (
            <p role="status" className="text-ink-muted">
              Loading queue...
            </p>
          ) : error ? (
            <EmptyState variant="error" icon={FaFlag} title="Could not load the queue" description={error} action="Try again" onAction={load} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={FaFlag}
              title={status === "open" ? "Nothing to review" : "Nothing resolved yet"}
              description={
                status === "open"
                  ? "Reported doubts and replies, and anything held for review, will appear here."
                  : "Items you approve, remove or restore will be listed here."
              }
            />
          ) : (
            <>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <QueueRow
                    key={`${item.type}:${item.id}`}
                    item={item}
                    selected={selected?.id === item.id && selected?.type === item.type}
                    onSelect={(it) => setSelected({ type: it.type, id: it.id })}
                  />
                ))}
              </ul>
              {nextCursor && (
                <div className="mt-4">
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
                    Show more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {wide && (
          <aside className="min-w-0">
            <div className="card sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto p-5 shadow-e3">
              {detail || (
                <div className="grid min-h-[240px] place-items-center text-center">
                  <p className="text-sm text-ink-muted">Choose an item to see the full text, its reports and the author.</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {!wide && (
        <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Review item" size="lg">
          {detail}
        </Modal>
      )}
    </div>
  );
}

// ─── Actions log ────────────────────────────────────────────────────────────

function ActionsLog() {
  const [actions, setActions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModerationActions();
      setActions(data.actions || []);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getModerationActions(nextCursor);
      setActions((prev) => [...prev, ...(data.actions || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <p role="status" className="text-ink-muted">Loading actions...</p>;
  if (error) return <EmptyState variant="error" icon={FaHistory} title="Could not load the log" description={error} action="Try again" onAction={load} />;
  if (actions.length === 0) {
    return <EmptyState icon={FaHistory} title="No actions yet" description="Every approve, remove, restore, mute and unmute is recorded here. Records can't be edited or deleted." />;
  }
  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">Every moderator decision, newest first. Records can't be edited or deleted.</p>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {actions.map((a) => (
          <li key={a.id} className="grid gap-1.5 px-4 py-3 md:grid-cols-[9rem_minmax(0,1fr)_12rem] md:items-start md:gap-4">
            <div className="flex items-center gap-2 md:block">
              <Pill className={ACTION_CLS[a.action]}>{ACTION_LABEL[a.action] || a.action}</Pill>
              <p className="text-xs text-ink-subtle md:mt-1.5" title={fullDate(a.createdAt)}>
                {shortDate(a.createdAt)} · {new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate text-ink">
                {a.targetType === "user" ? (
                  <>
                    Student <span className="font-semibold">{a.targetAuthor?.firstName || "–"}</span>
                    {a.action === "mute" &&
                      (a.muteDays === "permanent" ? " until unmuted" : ` for ${a.muteDays} ${a.muteDays === 1 ? "day" : "days"}`)}
                  </>
                ) : (
                  <>
                    <span className="text-ink-muted">{a.targetType === "doubt" ? "Doubt" : "Reply"}:</span> {a.targetLabel || "–"}
                  </>
                )}
              </p>
              {a.note && <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-ink-muted">“{a.note}”</p>}
            </div>
            <div className="text-xs text-ink-muted md:text-right">
              {a.targetType !== "user" && a.targetAuthor && <p>Author: {authorLabel(a.targetAuthor)}</p>}
              <p>
                {a.beforeStatus} → {a.afterStatus}
                {a.reportsResolved ? ` · ${a.reportsResolved} ${a.reportsResolved === 1 ? "report" : "reports"} closed` : ""}
              </p>
              <p>By {a.admin?.firstName || "Admin"}</p>
            </div>
          </li>
        ))}
      </ul>
      {nextCursor && (
        <div className="mt-4">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

/** The "Doubts moderation" tab. `openCount` / `onCountsChange` keep the tab's badge in step. */
export default function DoubtsModeration({ openCount, onCountsChange }) {
  const [view, setView] = useState("queue");
  const refreshCounts = useCallback(() => {
    getModerationCounts()
      .then((data) => onCountsChange?.(data.counts?.open ?? 0))
      .catch(() => {});
  }, [onCountsChange]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-ink">Doubts moderation</h2>
        <Segmented
          label="Moderation view"
          value={view}
          onChange={setView}
          options={[
            { value: "queue", label: "Queue" },
            { value: "log", label: "Actions log" },
          ]}
        />
      </div>
      {view === "queue" ? <QueueView openCount={openCount} refreshCounts={refreshCounts} /> : <ActionsLog />}
    </div>
  );
}
