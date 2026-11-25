import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCheck, FaChevronLeft, FaChevronRight, FaHeart, FaRegCommentDots, FaRegHeart, FaRobot } from "react-icons/fa";
import { FiSearch, FiX } from "react-icons/fi";
import Seo from "../components/Seo";
import { Button, EmptyState, Field, Modal, Select } from "../components/ui";
import ParentApproval from "../components/doubts/ParentApproval";
import DoubtThread from "../components/doubts/DoubtThread";
import DoubtsShell from "../components/doubts/DoubtsShell";
import Chatbot from "./Chatbot";
import {
  DOUBT_SUBJECTS,
  DRAFT_KEY,
  createDoubt,
  getConsent,
  getFeed,
  getMyDoubts,
  getQuota,
  getSimilarDoubts,
  muteLabel,
  readMute,
  setDoubtsClass,
  timeAgo,
  toggleDoubtHelpful,
} from "../utils/doubtsApi";
import {
  STALE_MS,
  dedupeRequest,
  getFeedCache,
  getGateCache,
  getTabUi,
  invalidateFeedCaches,
  isFresh,
  patchDoubtInCaches,
  patchTabUi,
  setConsentCache,
  setFeedCache,
  setLastDoubtsSection,
  setQuotaCache,
} from "../utils/doubtsStore";
import {
  getSchoolClassLabel,
  getStoredUser,
  mergeSchoolClassIntoUser,
  schoolClassOptions,
} from "../utils/schoolCatalogData";

const ALL = "All subjects";

// A doubt drafted on Ask ("Still confused? Ask your class") waits in
// sessionStorage until the student posts it or discards it, so it survives the
// class and parent-approval steps, closing the composer, a reload and
// Back/Forward. The composer writes the student's edits back into it. A draft
// more than a day old is dropped.
const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000;
function readDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    if (!draft || typeof draft !== "object") return null;
    if (typeof draft.savedAt === "number" && Date.now() - draft.savedAt > DRAFT_MAX_AGE) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
// Merges into the stored draft; does nothing once it has been posted or discarded.
function updateDraft(patch) {
  try {
    const current = readDraft();
    if (current) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Storage blocked: the draft lasts for this visit only.
  }
}
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}

// ─── Step 1: choose a class ────────────────────────────────────────────────

function ClassPicker({ onDone }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await setDoubtsClass(value);
      mergeSchoolClassIntoUser(value);
      onDone(value);
    } catch (err) {
      // The class was already set on another device: carry on.
      if (err.code === "class_set") onDone("");
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-xl space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Which class are you in?</h2>
        <p className="mt-1 text-sm text-ink-muted">
          You will see doubts from students in the same class. Choose carefully: this can't be changed here later.
        </p>
      </div>
      <Select id="doubts-class" label="Your class" value={value} onChange={setValue} options={schoolClassOptions} placeholder="Choose a class" />
      {error && (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
      <Button onClick={save} loading={busy} disabled={!value}>
        Continue
      </Button>
    </div>
  );
}

// ─── Ask a doubt ───────────────────────────────────────────────────────────

function Composer({ open, onClose, onPosted, onDiscard, onMuted, quota, draft }) {
  const [subject, setSubject] = useState(() => (DOUBT_SUBJECTS.includes(draft?.subject) ? draft.subject : ""));
  const [chapter, setChapter] = useState(() => String(draft?.chapter || "").slice(0, 120));
  const [title, setTitle] = useState(() => String(draft?.title || "").slice(0, 150));
  const [body, setBody] = useState(() => String(draft?.body || "").slice(0, 4000));
  // The Ask conversation this doubt came from. The server adds the AI's answer
  // from it as the first reply, but only when /from-chat said hasAiAnswer (not
  // after a hint-only chat, or when that chat was already posted).
  const [chatSessionId, setChatSessionId] = useState(() => (draft?.hasAiAnswer === true && draft?.sessionId) || "");
  const showAiNote = Boolean(chatSessionId);
  const [similar, setSimilar] = useState([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const problemRef = useRef(null);
  const keepRef = useRef(null);

  // Keep the stored draft in step with the student's edits.
  const hasDraft = Boolean(draft);
  useEffect(() => {
    if (!hasDraft) return;
    updateDraft({ subject, chapter, title, body, sessionId: chatSessionId, hasAiAnswer: Boolean(chatSessionId) });
  }, [hasDraft, subject, chapter, title, body, chatSessionId]);

  // A refused post leaves focus nowhere (Post was disabled while checking), so
  // move it to the message: keyboard and screen-reader users land on it.
  useEffect(() => {
    if (problem) problemRef.current?.focus();
  }, [problem]);
  useEffect(() => {
    if (confirmDiscard) keepRef.current?.focus();
  }, [confirmDiscard]);

  // Similar doubts appear while the student types the question.
  useEffect(() => {
    const q = title.trim();
    if (!open || q.length < 8) {
      setSimilar([]);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(() => {
      getSimilarDoubts(q)
        .then((data) => alive && setSimilar(data.doubts || []))
        .catch(() => alive && setSimilar([]));
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [title, open]);

  const reset = () => {
    setSubject("");
    setChapter("");
    setTitle("");
    setBody("");
    setSimilar([]);
    setProblem(null);
    setChatSessionId("");
    setConfirmDiscard(false);
  };

  // Closing (X, Escape, the scrim) keeps a draft from Ask for later.
  const close = () => {
    setConfirmDiscard(false);
    onClose();
  };
  // Cancel on a draft from Ask asks first, then throws it away.
  const cancel = () => {
    if (hasDraft) setConfirmDiscard(true);
    else close();
  };
  const discard = () => {
    reset();
    onDiscard();
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      const data = await createDoubt({
        subject,
        chapter: chapter.trim(),
        title: title.trim(),
        body: body.trim(),
        chatSessionId: showAiNote ? chatSessionId : undefined,
      });
      reset();
      onPosted(data);
    } catch (err) {
      // Muted by a moderator since the page loaded: the page switches to its calm muted state
      // (and closes this), keeping what was written as the draft.
      if (err.code === "muted") {
        onMuted(err.data);
        return;
      }
      setProblem({ code: err.code, message: err.message, englishVersion: err.data?.englishVersion || "" });
    } finally {
      setBusy(false);
    }
  };

  // Put the suggested English version into the form for the student to check.
  const useEnglish = () => {
    const lines = problem.englishVersion
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("[Chapter"));
    setTitle((lines[0] || "").slice(0, 150));
    setBody(lines.slice(1).join("\n"));
    setProblem(null);
  };

  const left = quota?.left ?? null;
  return (
    <Modal
      open={open}
      onClose={close}
      title="Ask your class"
      description={
        left === null ? "Write in English." : `Write in English. You have ${left} ${left === 1 ? "post" : "posts"} left today.`
      }
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Quick Subject Chips */}
        <div>
          <span className="label">Subject</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DOUBT_SUBJECTS.map((subj) => {
              const active = subject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubject(subj)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                    active
                      ? "bg-brand text-brand-fg border-brand shadow-e1"
                      : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
          <Field id="doubt-chapter" label="Chapter (optional)" value={chapter} onChange={(e) => setChapter(e.target.value)} maxLength={120} placeholder="e.g. Ch 1: Chemical Reactions" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="doubt-title" className="label mb-0">
              Your question
            </label>
            <span className="text-micro font-medium text-ink-subtle tabular-nums">
              {title.length} / 150
            </span>
          </div>
          <input
            id="doubt-title"
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="Why does ice float on water?"
            required
          />
        </div>

        {similar.length > 0 && (
          <div className="rounded-control border border-brand/25 bg-brand-soft/35 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand">
              Already asked in your class
            </p>
            <ul className="mt-2.5 space-y-2">
              {similar.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/doubts/${item.id}`} onClick={close} className="font-semibold text-ink hover:text-brand underline-offset-2 hover:underline truncate">
                    {item.title}
                  </Link>
                  <span className="shrink-0 text-micro font-semibold text-ink-subtle tabular-nums">
                    {item.replyCount} {item.replyCount === 1 ? "reply" : "replies"}
                    {item.answered ? " · Resolved" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="doubt-body" className="label mb-0">
              Details (optional)
            </label>
            <span className="text-micro font-medium text-ink-subtle tabular-nums">
              {body.length} / 4000
            </span>
          </div>
          <textarea
            id="doubt-body"
            className="field min-h-[120px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && subject && title.trim().length >= 8 && left !== 0) {
                e.preventDefault();
                submit(e);
              }
            }}
            maxLength={4000}
            placeholder="What have you tried? Where did you get stuck?"
          />
        </div>

        {showAiNote && (
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <FaRobot aria-hidden="true" className="text-brand" />
              The AI&apos;s answer will be added as the first reply.
            </span>
            <button
              type="button"
              onClick={() => setChatSessionId("")}
              className="min-h-[44px] font-semibold text-brand underline-offset-2 hover:underline"
            >
              Don&apos;t add it
            </button>
          </p>
        )}

        {problem && (
          <div
            ref={problemRef}
            tabIndex={-1}
            role="alert"
            className="space-y-3 rounded-control bg-critical-soft px-4 py-3 text-sm text-critical focus:outline-none"
          >
            <p>{problem.message}</p>
            {problem.code === "not_english" && problem.englishVersion && (
              <div className="rounded-control border border-line bg-surface p-3 text-ink">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Your post in English</p>
                <p className="mt-1 whitespace-pre-wrap">{problem.englishVersion.replace(/\n?\[Chapter:[^\]]*\]\s*$/, "")}</p>
                <Button variant="secondary" className="mt-3" onClick={useEnglish}>
                  Use this version
                </Button>
              </div>
            )}
            {problem.code === "daily_limit" && !quota?.paid && (
              <Link to="/subscription" className="font-semibold underline">
                See plans
              </Link>
            )}
          </div>
        )}

        {confirmDiscard ? (
          // Its own key: without it React reuses the "Post" submit button for "Keep editing",
          // and the click that opened this row would submit the form.
          <div key="confirm-discard" className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <p className="w-full text-sm text-ink-muted sm:mr-auto sm:w-auto">Discard this draft?</p>
            <Button ref={keepRef} variant="ghost" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={discard}>
              Discard
            </Button>
          </div>
        ) : (
          <div key="composer-actions" className="flex flex-wrap justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} loadingText="Checking…" disabled={!subject || title.trim().length < 8 || left === 0}>
              Post to my class
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Lists (Class feed and My doubts) ──────────────────────────────────────

const STATUS_LABEL = { pending: "Being checked", removed: "Hidden" };

const AVATAR_TONES = 5;
const avatarTone = (name) => [...String(name)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES;

function DoubtCard({ doubt, from }) {
  const [helpOverride, setHelpOverride] = useState(null);
  const [busy, setBusy] = useState(false);
  const [helpError, setHelpError] = useState("");

  const helped = helpOverride ? helpOverride.helped : Boolean(doubt.helpedByMe);
  const helpfulCount = helpOverride ? helpOverride.helpfulCount : doubt.helpfulCount || 0;

  const removed = doubt.status === "removed";
  const name = doubt.mine ? "You" : doubt.author?.firstName || "A classmate";
  const statusLabel = doubt.removedByModerator
    ? "Removed by a moderator"
    : doubt.status && doubt.status !== "live"
      ? STATUS_LABEL[doubt.status] || doubt.status
      : "";
  const answers = `${doubt.replyCount} ${doubt.replyCount === 1 ? "answer" : "answers"}`;

  const toggleHelped = async () => {
    setBusy(true);
    setHelpError("");
    try {
      const data = await toggleDoubtHelpful(doubt.id);
      const next = { helped: Boolean(data.helpedByMe), helpfulCount: data.helpfulCount || 0 };
      setHelpOverride(next);
      patchDoubtInCaches(doubt.id, (prev) => ({
        ...prev,
        helpedByMe: next.helped,
        helpfulCount: next.helpfulCount,
      }));
    } catch (err) {
      setHelpError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="dbc-slide">
      <article className={`dbc-card ${removed ? "is-removed" : ""}`}>
        <header className="dbc-head">
          <span className={`dbc-avatar dbc-tone-${avatarTone(doubt.author?.firstName || name)}`} aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">{name}</span>
            <span className="block truncate text-xs text-ink-subtle">
              {doubt.subject}{doubt.chapter ? ` · ${doubt.chapter}` : ""}
            </span>
          </span>
          {statusLabel ? (
            <span className="shrink-0 rounded-full bg-caution-soft px-2.5 py-0.5 text-micro font-bold text-caution">{statusLabel}</span>
          ) : doubt.acceptedReply ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive-soft px-2.5 py-0.5 text-micro font-bold text-positive">
              <FaCheck aria-hidden="true" className="text-[0.6rem]" /> Resolved
            </span>
          ) : doubt.hasAiAnswer ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-micro font-bold text-brand">
              <FaRobot aria-hidden="true" className="text-[0.65rem]" /> AI answered
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-line bg-surface-sunken px-2.5 py-0.5 text-micro font-semibold text-ink-subtle">
              Open
            </span>
          )}
        </header>

        <div className="dbc-copy">
          <h3 className="font-display text-[1.0625rem] font-extrabold leading-snug tracking-tight text-ink">
            {/* A removed doubt (only shown to its author) has no thread to open. */}
            {removed ? doubt.title : (
              <Link to={`/doubts/${doubt.id}`} state={{ from }} className="dbc-open">{doubt.title}</Link>
            )}
          </h3>
          {doubt.body && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{doubt.body}</p>}
        </div>

        <footer className="dbc-foot">
          <button
            type="button"
            className={`dbc-chip ${helped ? "is-on" : ""}`}
            onClick={toggleHelped}
            disabled={busy || doubt.mine || removed}
            aria-pressed={helped}
            aria-label={`This helped me, ${helpfulCount} so far`}
            title={doubt.mine ? "You can't mark your own doubt" : "This helped me"}
          >
            {helped ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
            <span className="tabular-nums">{helpfulCount}</span>
          </button>
          <span className="text-xs text-ink-subtle">{timeAgo(doubt.createdAt)}</span>
          <span className="dbc-replies" aria-label={answers}>
            <FaRegCommentDots aria-hidden="true" />
            <span className="tabular-nums">{answers}</span>
          </span>
        </footer>
        {helpError && <p role="alert" className="dbc-error">{helpError}</p>}
      </article>
    </li>
  );
}

// Laptop: a two-column grid. Phone: one card at a time, swiped sideways.
function DoubtDeck({ doubts, from, hasMore, loadingMore, onLoadMore }) {
  const deckRef = useRef(null);
  const [index, setIndex] = useState(() => getTabUi(from)?.deckIndex || 0);
  const last = Math.max(0, doubts.length - 1);
  const current = Math.min(index, last);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck?.clientWidth || current <= 0) return;
    deck.scrollTo({ left: current * deck.clientWidth, behavior: "auto" });
    // Restore horizontal card position on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const deck = deckRef.current;
    if (!deck?.clientWidth) return;
    const nextIdx = Math.round(deck.scrollLeft / deck.clientWidth);
    setIndex(nextIdx);
    patchTabUi(from, { deckIndex: nextIdx });
  };

  const goTo = (next) => {
    const deck = deckRef.current;
    if (!deck) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    deck.scrollTo({ left: next * deck.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  // Reaching the last card on a phone fetches the next page.
  useEffect(() => {
    const swiping = window.matchMedia("(max-width: 767px)").matches;
    if (swiping && hasMore && !loadingMore && current === last) onLoadMore();
  }, [current, last, hasMore, loadingMore, onLoadMore]);

  return (
    <>
      <ul ref={deckRef} className="dbc-deck" onScroll={onScroll} tabIndex={0} aria-label="Doubts">
        {doubts.map((doubt) => (
          <DoubtCard key={doubt.id} doubt={doubt} from={from} />
        ))}
      </ul>
      {doubts.length > 1 && (
        <div className="dbc-pager">
          <button type="button" className="dbc-arrow" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Previous doubt">
            <FaChevronLeft aria-hidden="true" />
          </button>
          <span className="text-[0.8125rem] font-semibold tabular-nums text-ink-muted" aria-live="polite">
            {current + 1} of {doubts.length}{hasMore ? "+" : ""}
          </span>
          <button type="button" className="dbc-arrow" onClick={() => goTo(current + 1)} disabled={current === last} aria-label="Next doubt">
            <FaChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}

// A calm, centred message inside the list panel. Same shape for "nothing yet"
// in every section (Ask AI's empty chat is centred the same way).
function QuietEmpty({ title, children }) {
  return (
    <div className="card px-6 py-14 text-center">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{children}</p>}
    </div>
  );
}

function DoubtFeedSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className="dbc-card animate-pulse motion-reduce:animate-none">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-surface-sunken" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-surface-sunken" />
              <div className="h-3 w-36 rounded bg-surface-sunken" />
            </div>
            <div className="h-5 w-16 rounded-full bg-surface-sunken" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-4 w-5/6 rounded bg-surface-sunken" />
            <div className="h-3.5 w-2/3 rounded bg-surface-sunken" />
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
            <div className="h-7 w-16 rounded-full bg-surface-sunken" />
            <div className="h-4 w-12 rounded bg-surface-sunken" />
          </div>
        </div>
      ))}
    </div>
  );
}

function computeSubjectCounts(doubts) {
  const map = { [ALL]: doubts.length };
  for (const d of doubts) {
    if (d.subject) map[d.subject] = (map[d.subject] || 0) + 1;
  }
  return map;
}

function DoubtList({ tab, reloadKey, classLabel }) {
  const savedUi = getTabUi(tab);
  const initialSubject = tab === "class" ? savedUi?.subject || ALL : ALL;
  const initialFeed = getFeedCache(tab, initialSubject === ALL ? "" : initialSubject);

  const [subject, setSubject] = useState(() => initialSubject);
  const [statusFilter, setStatusFilter] = useState(() => savedUi?.statusFilter || "all"); // all | answered | open
  const [searchQuery, setSearchQuery] = useState(() => savedUi?.searchQuery || "");
  const [doubts, setDoubts] = useState(() => initialFeed?.doubts || []);
  const [nextBefore, setNextBefore] = useState(() => initialFeed?.nextBefore || null);
  const [loading, setLoading] = useState(() => !initialFeed);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [subjectCounts, setSubjectCounts] = useState(() => {
    if (savedUi?.subjectCounts) return savedUi.subjectCounts;
    if (initialSubject === ALL && initialFeed?.doubts) return computeSubjectCounts(initialFeed.doubts);
    return {};
  });
  const requestId = useRef(0);
  const lastReloadKey = useRef(reloadKey);

  const load = useCallback(async ({ targetSubject = subject, quiet = false } = {}) => {
    const id = ++requestId.current;
    const subjParam = tab === "class" && targetSubject !== ALL ? targetSubject : "";
    if (!quiet) setLoading(true);
    setError("");
    try {
      const reqKey = `feed:${tab}:${subjParam || "__all__"}`;
      const data = await dedupeRequest(reqKey, () =>
        tab === "mine" ? getMyDoubts() : getFeed({ subject: subjParam })
      );
      if (id !== requestId.current) return;
      const list = data.doubts || [];
      const cursor = data.nextBefore || null;
      setDoubts(list);
      setNextBefore(cursor);
      setFeedCache(tab, subjParam, { doubts: list, nextBefore: cursor });
      if (tab === "class" && !subjParam) {
        const counts = computeSubjectCounts(list);
        setSubjectCounts(counts);
        patchTabUi(tab, { subjectCounts: counts });
      }
    } catch (err) {
      if (id === requestId.current && !quiet) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [tab, subject]);

  useEffect(() => {
    const forced = reloadKey !== lastReloadKey.current;
    lastReloadKey.current = reloadKey;
    const subjParam = tab === "class" && subject !== ALL ? subject : "";
    const cached = getFeedCache(tab, subjParam);
    if (forced || !cached) {
      load({ targetSubject: subject, quiet: Boolean(cached) });
    } else if (!isFresh(cached.fetchedAt, STALE_MS.feed)) {
      load({ targetSubject: subject, quiet: true });
    }
  }, [load, reloadKey, tab, subject]);

  const selectSubject = (nextSubj) => {
    setSubject(nextSubj);
    patchTabUi(tab, { subject: nextSubj, deckIndex: 0 });
    const subjParam = nextSubj === ALL ? "" : nextSubj;
    const hit = getFeedCache(tab, subjParam);
    if (hit) {
      setDoubts(hit.doubts || []);
      setNextBefore(hit.nextBefore || null);
      setLoading(false);
      setError("");
      if (!isFresh(hit.fetchedAt, STALE_MS.feed)) {
        load({ targetSubject: nextSubj, quiet: true });
      }
    } else {
      load({ targetSubject: nextSubj, quiet: false });
    }
  };

  const selectStatus = (nextStatus) => {
    setStatusFilter(nextStatus);
    patchTabUi(tab, { statusFilter: nextStatus, deckIndex: 0 });
  };

  const changeSearch = (nextQuery) => {
    setSearchQuery(nextQuery);
    patchTabUi(tab, { searchQuery: nextQuery, deckIndex: 0 });
  };

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const subjParam = subject === ALL ? "" : subject;
      const data = await getFeed({ subject: subjParam, before: nextBefore });
      const merged = [...doubts, ...(data.doubts || [])];
      const cursor = data.nextBefore || null;
      setDoubts(merged);
      setNextBefore(cursor);
      setFeedCache(tab, subjParam, { doubts: merged, nextBefore: cursor });
    } catch (err) {
      setNextBefore(null);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [tab, subject, nextBefore, doubts]);

  const statusCounts = useMemo(() => {
    let answered = 0;
    let open = 0;
    for (const d of doubts) {
      if (d.acceptedReply || d.hasAiAnswer || (d.replyCount || 0) > 0) answered++;
      else open++;
    }
    return { all: doubts.length, answered, open };
  }, [doubts]);

  const visibleDoubts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doubts.filter((d) => {
      if (statusFilter === "answered" && !d.acceptedReply && !d.hasAiAnswer && (d.replyCount || 0) === 0) {
        return false;
      }
      if (statusFilter === "open" && (d.acceptedReply || (d.replyCount || 0) > 0)) {
        return false;
      }
      if (q) {
        const hay = `${d.title || ""} ${d.body || ""} ${d.chapter || ""} ${d.subject || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [doubts, statusFilter, searchQuery]);

  const filtered = subject !== ALL || statusFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Ed Discussion / Linear Toolbar: Search + Status Pills + Subject Filter Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search questions or chapters…"
              aria-label="Search doubts"
              className="w-full h-10 pl-10 pr-8 rounded-full border border-line bg-surface text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => changeSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-ink-subtle hover:text-ink"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Status Segmented Toggle with Counts */}
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5">
              {[
                { id: "all", label: "All", n: statusCounts.all },
                { id: "answered", label: "Answered", n: statusCounts.answered },
                { id: "open", label: "Unanswered", n: statusCounts.open },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => selectStatus(st.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums transition-colors ${
                    statusFilter === st.id
                      ? "bg-brand text-brand-fg"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {st.label}{!loading && st.n > 0 ? ` (${st.n})` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Subject Pills with Counts (Class feed) */}
        {tab === "class" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[ALL, ...DOUBT_SUBJECTS].map((subj) => {
              const active = subject === subj;
              const n = subjectCounts[subj];
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => selectSubject(subj)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border tabular-nums transition-all active:scale-95 ${
                    active
                      ? "bg-brand text-brand-fg border-brand shadow-e1"
                      : "bg-surface text-ink-muted border-line hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {subj}{typeof n === "number" && n > 0 ? ` (${n})` : ""}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <DoubtFeedSkeleton />
      ) : error ? (
        <EmptyState variant="error" title="We couldn't load doubts" description={error} action="Try again" onAction={load} />
      ) : visibleDoubts.length === 0 ? (
        tab === "mine" && !filtered ? (
          <QuietEmpty title="You haven't asked anything yet">
            Doubts you post to your class appear here, with their answers.
          </QuietEmpty>
        ) : filtered ? (
          <QuietEmpty title="No matching doubts found">
            Try clearing your search or switching subject/status filters.
          </QuietEmpty>
        ) : (
          <QuietEmpty title={`No doubts in ${classLabel || "your class"} yet`}>
            Be the first to ask. If you want an answer right now, try Ask AI first.
          </QuietEmpty>
        )
      ) : (
        <>
          <DoubtDeck
            doubts={visibleDoubts}
            from={tab}
            hasMore={tab === "class" && Boolean(nextBefore)}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
          {tab === "class" && nextBefore && (
            <div className="mt-4 hidden justify-center md:flex">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Gates: class, then parent approval (Class feed, My doubts, threads) ────

function GateLoading() {
  return <p className="db-subtle py-2 text-sm">Loading…</p>;
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Doubts({ section = "class" }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const current = id ? "thread" : section;
  // On a thread, the tab marked is the list the student came from.
  const from = location.state?.from === "mine" ? "mine" : "class";

  useEffect(() => {
    if (current !== "thread") setLastDoubtsSection(current);
  }, [current]);

  const initialGate = getGateCache();
  const [schoolClass, setSchoolClass] = useState(() => getStoredUser()?.schoolClass || "");
  const [consent, setConsent] = useState(() => initialGate.consent || "loading"); // loading | approved | needed | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cachedGate = getGateCache();
    if (attempt === 0 && cachedGate.consent && isFresh(cachedGate.consentFetchedAt, STALE_MS.consent)) {
      return undefined;
    }
    let alive = true;
    dedupeRequest("consent", getConsent)
      .then((data) => {
        const status = data.consent?.status === "approved" ? "approved" : "needed";
        setConsentCache(status);
        if (alive) setConsent(status);
      })
      .catch((err) => {
        if (!alive) return;
        // Keep previously verified consent if a background revalidation fails.
        if (getGateCache().consent === "approved") return;
        setError(err.message);
        setConsent("error");
      });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const checkConsent = () => {
    setConsent("loading");
    setAttempt((n) => n + 1);
  };
  const ready = Boolean(schoolClass) && consent === "approved";

  // Posts left today, shown beside "Ask your class" on every page.
  const [quota, setQuota] = useState(() => initialGate.quota ?? null);
  // A moderator's mute: reading and Ask AI still work, posting, replying and AI answers do not.
  const [mute, setMute] = useState(() => initialGate.mute ?? readMute(null));
  useEffect(() => {
    if (!ready) return;
    if (isFresh(getGateCache().quotaFetchedAt, STALE_MS.quota) && getGateCache().quota) return;
    let alive = true;
    dedupeRequest("quota", getQuota)
      .then((data) => {
        const nextMute = readMute(data.mute);
        setQuotaCache({ quota: data.quota, mute: nextMute });
        if (!alive) return;
        setQuota(data.quota);
        setMute(nextMute);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready]);

  // The composer lives here, so "Ask your class" is the same on all four
  // pages. A draft from Ask AI ("Still confused? Ask your class") opens it
  // straight away, prefilled, and again after a reload unless the student had
  // closed it. It waits behind the class and parent-approval steps.
  const [draft, setDraft] = useState(readDraft);
  const [draftKey, setDraftKey] = useState(0);
  const [composing, setComposing] = useState(() => Boolean(draft && draft.open !== false));
  const onMuted = useCallback((data) => {
    const nextMute = readMute(data);
    setMute(nextMute);
    setQuotaCache({ mute: nextMute });
    setComposing(false);
  }, []);
  const [notice, setNotice] = useState(null); // { text, section }
  const [reloadKey, setReloadKey] = useState(0);

  const openComposer = () => {
    if (mute.muted) return;
    if (!ready) {
      // The class and approval steps are on Class feed; the composer opens
      // there once they are done only for a draft, so just go to them.
      navigate("/doubts/class");
      return;
    }
    setComposing(true);
    updateDraft({ open: true });
  };
  const closeComposer = () => {
    setComposing(false);
    updateDraft({ open: false });
  };
  const dropDraft = () => {
    clearDraft();
    setDraft(null);
  };
  // Ask AI stored a fresh draft: pick it up (the composer remounts with it).
  const pickUpDraft = () => {
    const next = readDraft();
    setDraft(next);
    setDraftKey((k) => k + 1);
    setComposing(Boolean(next && next.open !== false));
  };
  const onPosted = (data) => {
    dropDraft();
    setComposing(false);
    const nextQuota = data.quota || quota;
    setQuota(nextQuota);
    setQuotaCache({ quota: nextQuota });
    invalidateFeedCaches();
    const target = current === "mine" ? "mine" : "class";
    setNotice({ text: data.message || "Posted to your class.", section: target });
    setReloadKey((k) => k + 1);
    if (current !== target) navigate(`/doubts/${target}`);
  };

  const classLabel = getSchoolClassLabel(schoolClass);
  const left = quota?.left;
  const hasLeft = ready && typeof left === "number";
  const muted = ready && mute.muted;
  const count = muted
    ? muteLabel(mute)
    : hasLeft
      ? left === 0
        ? "No posts left today"
        : `${left} of ${quota.limit} ${quota.limit === 1 ? "post" : "posts"} left today`
      : null;

  let content;
  if (current === "ask") {
    content = <Chatbot onDraftReady={pickUpDraft} />;
  } else if (!schoolClass) {
    content = <ClassPicker onDone={(value) => setSchoolClass(value || getStoredUser()?.schoolClass || "set")} />;
  } else if (consent === "loading") {
    content = <GateLoading />;
  } else if (consent === "error") {
    content = <EmptyState variant="error" title="We couldn't open Doubts" description={error} action="Try again" onAction={checkConsent} />;
  } else if (consent === "needed") {
    content = (
      <div className="card max-w-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Ask a parent to approve</h2>
        <p className="mt-1 text-sm text-ink-muted">Class feed and My doubts open once a parent approves. Ask AI works now.</p>
        <div className="mt-5">
          <ParentApproval onApproved={() => {
            setConsentCache("approved");
            setConsent("approved");
          }} />
        </div>
      </div>
    );
  } else if (current === "thread") {
    content = (
      <DoubtThread
        key={id}
        id={id}
        mute={mute}
        onMuted={onMuted}
        back={from === "mine" ? { to: "/doubts/mine", label: "My doubts" } : { to: "/doubts/class", label: "Class feed" }}
      />
    );
  } else {
    content = (
      <>
        {muted ? (
          <p className="dbs-note mb-3">
            {muteLabel(mute)}. You can still read the class feed and use Ask AI.
          </p>
        ) : left === 0 && (
          <p className="dbs-note mb-3">
            You can post again tomorrow. You can still use Ask AI{quota?.paid ? "." : ", and a plan gives you 5 posts a day."}
          </p>
        )}
        <DoubtList key={current} tab={current} reloadKey={reloadKey} classLabel={classLabel} />
      </>
    );
  }

  const shownNotice = notice && notice.section === current ? notice.text : "";
  const seoPath = current === "thread" ? "/doubts" : `/doubts/${current}`;

  return (
    <DoubtsShell
      classLabel={classLabel}
      current={current === "thread" ? from : current}
      exact={current !== "thread"}
      count={count}
      action={
        <Button className="min-h-[42px] whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold shadow-e1" onClick={openComposer} disabled={muted || (hasLeft && left === 0)}>
          Ask your class
        </Button>
      }
    >
      <Seo title="Doubts | Kanthast School" description="Ask study questions and get answers from your class." path={seoPath} noindex />
      {shownNotice && (
        <p role="status" className="mb-3 rounded-control bg-positive-soft px-4 py-3 text-sm text-positive">
          {shownNotice}
        </p>
      )}
      {content}
      {ready && (
        <Composer
          key={draftKey}
          open={composing && !mute.muted}
          onClose={closeComposer}
          onMuted={onMuted}
          onPosted={onPosted}
          onDiscard={() => {
            dropDraft();
            setComposing(false);
          }}
          quota={quota}
          draft={draft}
        />
      )}
    </DoubtsShell>
  );
}
