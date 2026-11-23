import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaFlag, FaRegThumbsUp, FaRobot, FaThumbsUp } from "react-icons/fa";
import { Button, EmptyState, Modal, Select } from "../ui";
import {
  acceptReply,
  createReply,
  deleteDoubt,
  getDoubt,
  muteLabel,
  reportItem,
  requestAiAnswer,
  timeAgo,
  toggleDoubtHelpful,
  toggleReplyHelpful,
} from "../../utils/doubtsApi";

const REFRESH_MS = 25000;
const REASONS = [
  { value: "abuse", label: "Rude or hurtful" },
  { value: "personal_info", label: "Shares personal details" },
  { value: "spam", label: "Spam or not about studies" },
  { value: "wrong_answer", label: "The answer is wrong" },
  { value: "other", label: "Something else" },
];

// Every control in an action row is 44px tall. Text-only actions
// share TEXT_ACTION; a row made of them starts at -ml-3 so their words line up
// with the card's text, including after the row wraps on a phone.
const TEXT_ACTION =
  "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-fast ease-brand";

function HelpfulButton({ active, count, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-fast ease-brand disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-muted hover:text-ink"
      }`}
    >
      {active ? <FaThumbsUp aria-hidden="true" /> : <FaRegThumbsUp aria-hidden="true" />}
      This helped me{count > 0 ? ` · ${count}` : ""}
    </button>
  );
}

function ReportButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${TEXT_ACTION} font-normal text-ink-subtle hover:text-critical ${className}`}
    >
      <FaFlag aria-hidden="true" /> Report
    </button>
  );
}

export default function DoubtThread({ id, back: backTo = { to: "/doubts/class", label: "Class feed" }, mute = null, onMuted }) {
  const muted = Boolean(mute?.muted);
  const navigate = useNavigate();
  const [doubt, setDoubt] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { code, status, message }
  const [answer, setAnswer] = useState("");
  const [posting, setPosting] = useState(false);
  const [problem, setProblem] = useState(null);
  const [notice, setNotice] = useState("");
  const [reporting, setReporting] = useState(null); // { targetType, targetId }
  const [reason, setReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askingAi, setAskingAi] = useState(false);
  const problemRef = useRef(null);

  // A refused answer leaves focus nowhere (the button was disabled while
  // checking), so move it to the message.
  useEffect(() => {
    if (problem) problemRef.current?.focus();
  }, [problem]);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const data = await getDoubt(id);
        setDoubt(data.doubt);
        setReplies(data.replies || []);
        setError(null);
      } catch (err) {
        if (!quiet) setError({ code: err.code, status: err.status, message: err.message });
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // New answers arrive without a reload, while this tab is in front.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (action) => {
    setNotice("");
    try {
      await action();
      await load(true);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    setPosting(true);
    setProblem(null);
    setNotice("");
    try {
      const data = await createReply(id, answer.trim());
      setAnswer("");
      setNotice(data.message || "Answer posted.");
      await load(true);
    } catch (err) {
      // Muted since the page loaded: the reply box turns into the calm muted note (the text stays).
      if (err.code === "muted") {
        onMuted?.(err.data);
        return;
      }
      // Includes 429 daily_check_limit (too many tries today): shown as sent.
      setProblem({ code: err.code, message: err.message, englishVersion: err.data?.englishVersion || "" });
    } finally {
      setPosting(false);
    }
  };

  const askAi = async () => {
    setAskingAi(true);
    setProblem(null);
    setNotice("");
    try {
      const data = await requestAiAnswer(id);
      setNotice(data.message || "The AI answered. Its answer is below.");
      await load(true);
    } catch (err) {
      if (err.code === "muted") {
        onMuted?.(err.data);
      } else if (err.code === "ai_answer_exists") {
        // Someone asked first: show their answer.
        setNotice(err.message);
        await load(true);
      } else {
        setProblem({ code: err.code, message: err.message, paid: Boolean(err.data?.ai?.paid) });
      }
    } finally {
      setAskingAi(false);
    }
  };

  const sendReport = async () => {
    setReportBusy(true);
    try {
      const data = await reportItem({ ...reporting, reason });
      setNotice(data.message || "Thanks. An admin will look at this.");
      setReporting(null);
      setReason("");
      await load(true);
    } catch (err) {
      setNotice(err.message);
      setReporting(null);
    } finally {
      setReportBusy(false);
    }
  };

  const askAiLink = doubt ? (
    <Link
      to="/doubts/ask"
      state={{ prefill: [doubt.title, doubt.body].filter(Boolean).join("\n\n") }}
      className={`${TEXT_ACTION} text-ink-muted hover:text-ink`}
    >
      <FaRobot aria-hidden="true" /> Ask the AI about this
    </Link>
  ) : null;

  const back = (
    <Link to={backTo.to} className="db-muted -mt-2.5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold">
      <FaArrowLeft aria-hidden="true" className="text-xs" /> {backTo.label}
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <p className="db-subtle mt-2 text-sm">Loading…</p>
      </>
    );
  }
  if (error || !doubt) {
    // A connection or server failure can be retried; anything else means the
    // doubt is gone or not in this student's class.
    const failed = error && (error.code === "network" || error.status >= 500);
    return (
      <>
        {back}
        <div className="mt-2">
          {failed ? (
            <EmptyState variant="error" title="We couldn't load this doubt" description={error.message} action="Try again" onAction={() => load()} />
          ) : (
            <EmptyState
              variant="error"
              title="This doubt isn't available"
              description="It may have been removed, or it belongs to another class."
              action={`Back to ${backTo.label}`}
              onAction={() => navigate(backTo.to)}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <div className="max-w-3xl">
      {back}

      <article className="card mt-1 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="dbs-subject">{doubt.subject}</span>
          {doubt.chapter && <span className="text-ink-subtle">{doubt.chapter}</span>}
          {doubt.status === "pending" && (
            <span className="rounded-md bg-caution-soft px-2 py-0.5 font-semibold text-caution">Being checked. Only you can see this.</span>
          )}
        </div>
        <h2 className="mt-3 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">{doubt.title}</h2>
        {doubt.body && <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-muted">{doubt.body}</p>}
        <p className="mt-3 text-[0.8125rem] text-ink-subtle">
          {doubt.mine ? "You" : doubt.author?.firstName || "A classmate"} · {timeAgo(doubt.createdAt)}
        </p>
        {doubt.mine ? (
          confirmDelete ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="w-full text-sm text-ink-muted sm:w-auto">Delete this doubt? You won&apos;t get today&apos;s post back.</p>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await deleteDoubt(doubt.id);
                    navigate(backTo.to);
                  } catch (err) {
                    setNotice(err.message);
                    setConfirmDelete(false);
                  }
                }}
              >
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </div>
          ) : (
            // Two text actions: -ml-3 lines their words up with the card text,
            // on one row or wrapped onto two.
            <div className="-ml-3 mt-3 flex flex-wrap items-center gap-x-2">
              {askAiLink}
              <button type="button" onClick={() => setConfirmDelete(true)} className={`${TEXT_ACTION} text-ink-muted hover:text-ink`}>
                Delete my doubt
              </button>
            </div>
          )
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <HelpfulButton active={doubt.helpedByMe} count={doubt.helpfulCount} onClick={() => act(() => toggleDoubtHelpful(doubt.id))} />
            {askAiLink}
            <ReportButton className="ml-auto" onClick={() => setReporting({ targetType: "doubt", targetId: doubt.id })} />
          </div>
        )}
      </article>

      {notice && (
        <p role="status" className="mt-4 rounded-control bg-brand-soft px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      )}

      {replies.length > 0 ? (
        <h3 className="db-ink mt-7 font-display text-base font-bold">
          {replies.length} {replies.length === 1 ? "answer" : "answers"}
        </h3>
      ) : (
        <div className="mt-7">
          <h3 className="db-ink font-display text-base font-bold">No answers yet</h3>
          {doubt.status === "live" && (
            <p className="db-muted mt-1 text-sm">
              {doubt.mine ? "Answers from your class will appear here." : "Be the first to help."}
            </p>
          )}
        </div>
      )}
      {replies.length > 0 && (
      <ul className="mt-3 grid gap-3">
        {replies.map((reply) => (
          <li key={reply.id} className={`card p-5 sm:p-6 ${reply.accepted ? "is-accepted" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-subtle">
              {reply.isAI ? (
                <span className="dbs-subject gap-1.5">
                  <FaRobot aria-hidden="true" /> AI answer
                </span>
              ) : (
                <span className="font-semibold text-ink">{reply.mine ? "You" : reply.author?.firstName || "A classmate"}</span>
              )}
              <span>{timeAgo(reply.createdAt)}</span>
              {reply.accepted && (
                <span className="inline-flex items-center gap-1 font-semibold text-positive">
                  <FaCheckCircle aria-hidden="true" /> The answer that helped
                </span>
              )}
              {reply.status === "pending" && <span className="rounded-md bg-caution-soft px-2 py-0.5 text-xs font-semibold text-caution">Being checked</span>}
            </div>
            <p className="mt-2.5 whitespace-pre-wrap leading-relaxed text-ink">{reply.body}</p>
            {reply.status === "live" && (
              // All 48px. On a phone the pills wrap under each other at the
              // card edge and Report stays at the right.
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!reply.mine && <HelpfulButton active={reply.helpedByMe} count={reply.helpfulCount} onClick={() => act(() => toggleReplyHelpful(reply.id))} />}
                {reply.mine && reply.helpfulCount > 0 && <span className="text-sm text-ink-subtle">{reply.helpfulCount} found this helpful</span>}
                {doubt.mine && doubt.status === "live" && (
                  <Button variant="secondary" className="px-5" onClick={() => act(() => acceptReply(doubt.id, reply.id))}>
                    {reply.accepted ? "Unmark" : "This answered it"}
                  </Button>
                )}
                {!reply.mine && <ReportButton className="ml-auto" onClick={() => setReporting({ targetType: "reply", targetId: reply.id })} />}
              </div>
            )}
          </li>
        ))}
      </ul>
      )}

      {doubt.status === "live" && muted && (
        <div role="status" className="card mt-4 p-5 sm:p-6">
          <p className="font-display text-base font-bold text-ink">{muteLabel(mute)}</p>
          <p className="mt-1 text-sm text-ink-muted">
            A moderator has paused posting for your account. You can still read answers, mark what helped you and use Ask AI.
          </p>
        </div>
      )}

      {doubt.status === "live" && !muted && (
        <form onSubmit={submitAnswer} className="card mt-4 space-y-3 p-5 sm:p-6">
          <label htmlFor="doubt-answer" className="label">
            Your answer
          </label>
          <textarea
            id="doubt-answer"
            className="field min-h-[120px]"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={4000}
            placeholder="Explain it the way you understood it. Write in English."
          />
          {problem && (
            <div
              ref={problemRef}
              tabIndex={-1}
              role="alert"
              className="space-y-2 rounded-control bg-critical-soft px-4 py-3 text-sm text-critical focus:outline-none"
            >
              <p>
                {problem.message}
                {problem.code === "ai_daily_limit" && !problem.paid && (
                  <>
                    {" "}
                    <Link to="/subscription" className="font-semibold underline underline-offset-2">
                      See plans
                    </Link>
                  </>
                )}
              </p>
              {problem.code === "not_english" && problem.englishVersion && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAnswer(problem.englishVersion);
                    setProblem(null);
                  }}
                >
                  Use the English version
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {!doubt.hasAiAnswer && (
              <Button variant="secondary" className="mr-auto" onClick={askAi} loading={askingAi} loadingText="Asking the AI…">
                <FaRobot aria-hidden="true" className="mr-2 inline" />
                Answer using AI
              </Button>
            )}
            <Button type="submit" loading={posting} loadingText="Checking…" disabled={answer.trim().length < 2}>
              Post answer
            </Button>
          </div>
        </form>
      )}

      <Modal
        open={Boolean(reporting)}
        onClose={() => setReporting(null)}
        title="Report this"
        description="An admin will look at it. Your classmates won't know who reported."
      >
        <div className="space-y-4">
          <Select id="report-reason" label="What is wrong?" value={reason} onChange={setReason} options={REASONS} placeholder="Choose a reason" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReporting(null)}>
              Cancel
            </Button>
            <Button onClick={sendReport} loading={reportBusy} disabled={!reason}>
              Send report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
