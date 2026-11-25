import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaCheckCircle, FaFlag, FaRegThumbsUp, FaRobot, FaThumbsUp,
} from "react-icons/fa";
import { FiCheckCircle, FiClock, FiMessageSquare, FiCpu, FiTrash2 } from "react-icons/fi";
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
import {
  STALE_MS,
  dedupeRequest,
  getThreadCache,
  invalidateFeedCaches,
  isFresh,
  patchDoubtInCaches,
  removeDoubtFromCaches,
  setThreadCache,
} from "../../utils/doubtsStore";

const REFRESH_MS = 25000;
const REASONS = [
  { value: "abuse", label: "Rude or hurtful" },
  { value: "personal_info", label: "Shares personal details" },
  { value: "spam", label: "Spam or not about studies" },
  { value: "wrong_answer", label: "The answer is wrong" },
  { value: "other", label: "Something else" },
];

const TEXT_ACTION =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs sm:text-sm font-semibold transition-colors duration-fast ease-brand";

function HelpfulButton({ active, count, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs sm:text-sm font-semibold transition-all duration-fast ease-brand active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "border-brand bg-brand-soft text-brand"
          : "border-line bg-surface-sunken text-ink-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {active ? <FaThumbsUp aria-hidden="true" /> : <FaRegThumbsUp aria-hidden="true" />}
      <span>This helped me</span>
      {count > 0 && <span className="tabular-nums font-bold">· {count}</span>}
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
      <FaFlag aria-hidden="true" className="text-xs" /> Report
    </button>
  );
}

export default function DoubtThread({ id, back: backTo = { to: "/doubts/class", label: "Class feed" }, mute = null, onMuted }) {
  const muted = Boolean(mute?.muted);
  const navigate = useNavigate();
  const initialThread = getThreadCache(id);
  const [doubt, setDoubt] = useState(() => initialThread?.doubt || null);
  const [replies, setReplies] = useState(() => initialThread?.replies || []);
  const [loading, setLoading] = useState(() => !initialThread?.doubt);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState("");
  const [posting, setPosting] = useState(false);
  const [problem, setProblem] = useState(null);
  const [notice, setNotice] = useState("");
  const [reporting, setReporting] = useState(null);
  const [reason, setReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askingAi, setAskingAi] = useState(false);
  const problemRef = useRef(null);

  useEffect(() => {
    if (problem) problemRef.current?.focus();
  }, [problem]);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const data = await dedupeRequest(`thread:${id}`, () => getDoubt(id));
        setDoubt(data.doubt);
        setReplies(data.replies || []);
        setError(null);
        setThreadCache(id, { doubt: data.doubt, replies: data.replies || [] });
        if (data.doubt) {
          patchDoubtInCaches(id, (prev) => ({
            ...prev,
            helpfulCount: data.doubt.helpfulCount,
            helpedByMe: data.doubt.helpedByMe,
            replyCount: (data.replies || []).length,
            acceptedReply: data.doubt.acceptedReply || (data.replies || []).some((r) => r.accepted),
            hasAiAnswer: data.doubt.hasAiAnswer || (data.replies || []).some((r) => r.isAI),
          }));
        }
      } catch (err) {
        if (!quiet) setError({ code: err.code, status: err.status, message: err.message });
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const cached = getThreadCache(id);
    if (cached?.doubt) {
      if (!isFresh(cached.fetchedAt, STALE_MS.thread)) load(true);
    } else {
      load(false);
    }
  }, [id, load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Pin accepted answer cleanly at the top (Stack Overflow / GitHub Discussions pattern)
  const orderedReplies = useMemo(() => {
    return [...replies].sort((a, b) => Number(Boolean(b.accepted)) - Number(Boolean(a.accepted)));
  }, [replies]);

  const hasAccepted = useMemo(() => replies.some((r) => r.accepted), [replies]);

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
    event?.preventDefault();
    if (answer.trim().length < 2 || posting) return;
    setPosting(true);
    setProblem(null);
    setNotice("");
    try {
      const data = await createReply(id, answer.trim());
      setAnswer("");
      setNotice(data.message || "Answer posted.");
      await load(true);
    } catch (err) {
      if (err.code === "muted") {
        onMuted?.(err.data);
        return;
      }
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
      setNotice(data.message || "The AI answered. Its answer is pinned below.");
      await load(true);
    } catch (err) {
      if (err.code === "muted") {
        onMuted?.(err.data);
      } else if (err.code === "ai_answer_exists") {
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
      className={`${TEXT_ACTION} text-ink-muted hover:text-brand`}
    >
      <FaRobot aria-hidden="true" /> Ask AI about this
    </Link>
  ) : null;

  const back = (
    <Link to={backTo.to} className="db-muted -mt-2 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold hover:text-ink transition-colors">
      <FaArrowLeft aria-hidden="true" className="text-xs" /> {backTo.label}
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {back}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 card p-6 space-y-4 animate-pulse motion-reduce:animate-none">
            <div className="h-5 w-28 rounded-full bg-surface-sunken" />
            <div className="h-7 w-3/4 rounded-lg bg-surface-sunken" />
            <div className="h-20 w-full rounded-xl bg-surface-sunken" />
          </div>
          <div className="lg:col-span-4 card p-5 space-y-3 animate-pulse motion-reduce:animate-none">
            <div className="h-4 w-24 rounded bg-surface-sunken" />
            <div className="h-10 w-full rounded-xl bg-surface-sunken" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !doubt) {
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

  const authorName = doubt.mine ? "You" : doubt.author?.firstName || "A classmate";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {back}
        <div className="flex items-center gap-2">
          {hasAccepted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-positive-soft text-positive text-xs font-bold">
              <FiCheckCircle size={13} /> Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-ink-muted text-xs font-semibold">
              <FiMessageSquare size={13} /> Open for answers
            </span>
          )}
        </div>
      </div>

      {/* 2-Column Linear/Ed Discussion Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-5 min-w-0">
          <article className="card p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="dbs-subject">{doubt.subject}</span>
              {doubt.chapter && (
                <span className="px-2.5 py-0.5 rounded-full border border-line bg-surface-sunken text-ink-muted font-medium">
                  {doubt.chapter}
                </span>
              )}
              {doubt.status === "pending" && (
                <span className="rounded-full bg-caution-soft px-2.5 py-0.5 font-semibold text-caution">
                  Being checked · Only visible to you
                </span>
              )}
            </div>

            <h2 className="mt-3.5 font-display text-xl font-extrabold leading-snug text-ink sm:text-2xl tracking-tight">
              {doubt.title}
            </h2>

            {doubt.body && (
              <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-muted">
                {doubt.body}
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 text-xs text-ink-subtle">
                <span className="w-7 h-7 rounded-full bg-brand-soft text-brand font-extrabold flex items-center justify-center">
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <span>
                  Asked by <strong className="text-ink">{authorName}</strong> · {timeAgo(doubt.createdAt)}
                </span>
              </div>

              {doubt.mine ? (
                confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs text-ink-muted">Delete this doubt?</span>
                    <Button
                      variant="danger"
                      onClick={async () => {
                        try {
                          await deleteDoubt(doubt.id);
                          removeDoubtFromCaches(doubt.id);
                          invalidateFeedCaches();
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
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className={`${TEXT_ACTION} text-ink-muted hover:text-critical`}
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <HelpfulButton
                    active={doubt.helpedByMe}
                    count={doubt.helpfulCount}
                    onClick={() => act(() => toggleDoubtHelpful(doubt.id))}
                  />
                  <ReportButton onClick={() => setReporting({ targetType: "doubt", targetId: doubt.id })} />
                </div>
              )}
            </div>
          </article>

          {notice && (
            <p role="status" className="rounded-control border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-medium text-ink">
              {notice}
            </p>
          )}

          {/* Replies Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-ink">
                {orderedReplies.length > 0
                  ? `${orderedReplies.length} ${orderedReplies.length === 1 ? "Answer" : "Answers"}`
                  : "No answers yet"}
              </h3>
              {orderedReplies.length === 0 && doubt.status === "live" && (
                <span className="text-xs text-ink-subtle">
                  {doubt.mine ? "Answers from your class appear here." : "Be the first to help."}
                </span>
              )}
            </div>

            {orderedReplies.length > 0 && (
              <ul className="grid gap-3.5">
                {orderedReplies.map((reply) => {
                  const replier = reply.mine ? "You" : reply.author?.firstName || "A classmate";
                  return (
                    <li key={reply.id} className={`card p-5 sm:p-6 ${reply.accepted ? "is-accepted" : ""}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-ink-subtle">
                          {reply.isAI ? (
                            <span className="dbs-subject gap-1.5">
                              <FaRobot aria-hidden="true" /> Kanthast AI Tutor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 font-bold text-ink">
                              <span className="w-6 h-6 rounded-full bg-surface-sunken border border-line text-micro font-extrabold flex items-center justify-center">
                                {replier.charAt(0).toUpperCase()}
                              </span>
                              {replier}
                            </span>
                          )}
                          <span>· {timeAgo(reply.createdAt)}</span>
                          {reply.status === "pending" && (
                            <span className="rounded-full bg-caution-soft px-2 py-0.5 font-semibold text-caution">
                              Being checked
                            </span>
                          )}
                        </div>

                        {reply.accepted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-positive-soft text-positive font-bold">
                            <FaCheckCircle aria-hidden="true" /> Accepted answer
                          </span>
                        )}
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink">
                        {reply.body}
                      </p>

                      {reply.status === "live" && (
                        <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-2">
                          {!reply.mine && (
                            <HelpfulButton
                              active={reply.helpedByMe}
                              count={reply.helpfulCount}
                              onClick={() => act(() => toggleReplyHelpful(reply.id))}
                            />
                          )}
                          {reply.mine && reply.helpfulCount > 0 && (
                            <span className="text-xs font-medium text-ink-subtle tabular-nums">
                              {reply.helpfulCount} found this helpful
                            </span>
                          )}
                          {doubt.mine && doubt.status === "live" && (
                            <Button variant="secondary" className="px-4 py-1.5 text-xs" onClick={() => act(() => acceptReply(doubt.id, reply.id))}>
                              {reply.accepted ? "Unmark accepted" : "Mark as helpful answer"}
                            </Button>
                          )}
                          {!reply.mine && (
                            <ReportButton className="ml-auto" onClick={() => setReporting({ targetType: "reply", targetId: reply.id })} />
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {doubt.status === "live" && muted && (
            <div role="status" className="card p-5 sm:p-6">
              <p className="font-display text-base font-bold text-ink">{muteLabel(mute)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                A moderator has paused posting for your account. You can still read answers, mark what helped you, and use Ask AI.
              </p>
            </div>
          )}

          {/* Answer Composer */}
          {doubt.status === "live" && !muted && (
            <form onSubmit={submitAnswer} className="card space-y-3.5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="doubt-answer" className="font-display text-sm font-extrabold text-ink">
                  Write an answer
                </label>
                <span className="text-micro font-medium text-ink-subtle tabular-nums">
                  {answer.length} / 4000
                </span>
              </div>
              <textarea
                id="doubt-answer"
                className="field min-h-[120px]"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    submitAnswer();
                  }
                }}
                maxLength={4000}
                placeholder="Explain it clearly step-by-step in English..."
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
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-micro text-ink-subtle hidden sm:inline">
                  Press Ctrl+Enter to post
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  {!doubt.hasAiAnswer && (
                    <Button variant="secondary" onClick={askAi} loading={askingAi} loadingText="Asking AI…">
                      <FaRobot aria-hidden="true" className="mr-2 inline" />
                      Answer using AI
                    </Button>
                  )}
                  <Button type="submit" loading={posting} loadingText="Posting…" disabled={answer.trim().length < 2}>
                    Post answer
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Context Rail */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="card p-5 space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-subtle">
              Thread Details
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted flex items-center gap-2">
                  <FiCheckCircle size={14} className="text-ink-subtle" /> Status
                </dt>
                <dd className={`font-bold ${hasAccepted ? "text-positive" : "text-ink"}`}>
                  {hasAccepted ? "Resolved" : "Open"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted flex items-center gap-2">
                  <FiMessageSquare size={14} className="text-ink-subtle" /> Replies
                </dt>
                <dd className="font-bold text-ink tabular-nums">{orderedReplies.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted flex items-center gap-2">
                  <FiClock size={14} className="text-ink-subtle" /> Asked
                </dt>
                <dd className="font-semibold text-ink">{timeAgo(doubt.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                <FiCpu size={15} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold font-display text-ink">Kanthast AI Assist</h3>
                <p className="text-micro text-ink-subtle">Instant curriculum-aligned clarity</p>
              </div>
            </div>
            {!doubt.hasAiAnswer && doubt.status === "live" && !muted && (
              <Button variant="secondary" className="w-full justify-center" onClick={askAi} loading={askingAi} loadingText="Generating…">
                <FaRobot aria-hidden="true" className="mr-2 inline" />
                Get AI Answer Here
              </Button>
            )}
            <div className="pt-0.5">{askAiLink}</div>
          </div>
        </aside>
      </div>

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
