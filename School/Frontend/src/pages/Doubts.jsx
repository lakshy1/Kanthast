import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCheck, FaRobot } from "react-icons/fa";
import Seo from "../components/Seo";
import { Button, EmptyState, Field, Modal, Select } from "../components/ui";
import ParentApproval from "../components/doubts/ParentApproval";
import DoubtThread from "../components/doubts/DoubtThread";
import DoubtsShell from "../components/doubts/DoubtsShell";
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
} from "../utils/doubtsApi";
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="doubt-subject" label="Subject" value={subject} onChange={setSubject} options={DOUBT_SUBJECTS} placeholder="Choose a subject" />
          <Field id="doubt-chapter" label="Chapter (optional)" value={chapter} onChange={(e) => setChapter(e.target.value)} maxLength={120} />
        </div>
        <Field
          id="doubt-title"
          label="Your question"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          placeholder="Why does ice float on water?"
          required
        />

        {similar.length > 0 && (
          <div className="rounded-control border border-line bg-surface-sunken p-4">
            <p className="text-sm font-semibold text-ink">Already asked in your class</p>
            <ul className="mt-2 space-y-1.5">
              {similar.map((item) => (
                <li key={item.id}>
                  <Link to={`/doubts/${item.id}`} onClick={close} className="text-sm text-brand underline-offset-2 hover:underline">
                    {item.title}
                  </Link>
                  <span className="ml-2 text-xs text-ink-subtle">
                    {item.replyCount} {item.replyCount === 1 ? "answer" : "answers"}
                    {item.answered ? " · answered" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="doubt-body" className="label">
            Details (optional)
          </label>
          <textarea
            id="doubt-body"
            className="field min-h-[130px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
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

function DoubtRow({ doubt, from }) {
  const answers = `${doubt.replyCount} ${doubt.replyCount === 1 ? "answer" : "answers"}`;
  const removed = doubt.status === "removed";
  const statusLabel = doubt.removedByModerator
    ? "Removed by a moderator"
    : doubt.status && doubt.status !== "live"
      ? STATUS_LABEL[doubt.status] || doubt.status
      : "";
  // A removed doubt (only ever shown to its author, in My doubts) has no thread to open.
  const Row = removed ? "div" : Link;
  const rowProps = removed ? { "aria-disabled": "true" } : { to: `/doubts/${doubt.id}`, state: { from } };
  return (
    <li>
      <Row {...rowProps} className={`dbs-row ${removed ? "cursor-default opacity-75" : ""}`}>
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="dbs-subject">{doubt.subject}</span>
          {doubt.chapter && <span className="truncate text-ink-subtle">{doubt.chapter}</span>}
          {statusLabel ? (
            <span className="ml-auto shrink-0 rounded-md bg-caution-soft px-2 py-0.5 font-semibold text-caution">{statusLabel}</span>
          ) : doubt.acceptedReply ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-positive">
              <FaCheck aria-hidden="true" className="text-[0.625rem]" /> Answered
            </span>
          ) : doubt.hasAiAnswer ? (
            <span className="ml-auto shrink-0 font-medium text-ink-subtle">AI answered</span>
          ) : null}
        </div>
        <h3 className="mt-2 font-display text-[0.9375rem] font-bold leading-snug text-ink sm:text-base">{doubt.title}</h3>
        {doubt.body && <p className="mt-1 line-clamp-2 max-w-[72ch] text-sm leading-relaxed text-ink-muted">{doubt.body}</p>}
        <p className="mt-2.5 flex flex-wrap items-center text-[0.8125rem] text-ink-subtle">
          <span>{doubt.mine ? "You" : doubt.author?.firstName || "A classmate"}</span>
          <span className="dbs-dot">{timeAgo(doubt.createdAt)}</span>
          <span className="dbs-dot">{answers}</span>
        </p>
      </Row>
    </li>
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

function DoubtList({ tab, reloadKey, classLabel }) {
  const [subject, setSubject] = useState(ALL);
  const [doubts, setDoubts] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = tab === "mine" ? await getMyDoubts() : await getFeed({ subject: subject === ALL ? "" : subject });
      if (id !== requestId.current) return;
      setDoubts(data.doubts || []);
      setNextBefore(data.nextBefore || null);
    } catch (err) {
      if (id === requestId.current) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [tab, subject]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getFeed({ subject: subject === ALL ? "" : subject, before: nextBefore });
      setDoubts((prev) => [...prev, ...(data.doubts || [])]);
      setNextBefore(data.nextBefore || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = subject !== ALL;
  const countLine = !loading && !error && doubts.length > 0
    ? `${doubts.length}${nextBefore ? "+" : ""} ${doubts.length === 1 ? "doubt" : "doubts"}`
    : "";

  return (
    <>
      {tab === "class" && (
        // Slim filter row: the subject at left, how many at right.
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="w-48 sm:w-52">
            <Select
              id="doubts-subject-filter"
              value={subject}
              onChange={setSubject}
              options={[ALL, ...DOUBT_SUBJECTS]}
              triggerClassName="min-h-[40px] py-2 text-sm font-semibold"
            />
          </div>
          {countLine && <span className="db-subtle text-[0.8125rem] tabular-nums">{countLine}</span>}
        </div>
      )}

      {loading ? (
        <p className="db-subtle py-2 text-sm">Loading doubts…</p>
      ) : error ? (
        <EmptyState variant="error" title="We couldn't load doubts" description={error} action="Try again" onAction={load} />
      ) : doubts.length === 0 ? (
        tab === "mine" ? (
          <QuietEmpty title="You haven't asked anything yet">
            Doubts you post to your class appear here, with their answers.
          </QuietEmpty>
        ) : filtered ? (
          <QuietEmpty title={`No ${subject} doubts yet`}>Try another subject, or ask this one yourself.</QuietEmpty>
        ) : (
          <QuietEmpty title={`No doubts in ${classLabel || "your class"} yet`}>
            Be the first to ask. If you want an answer right now, try Ask AI first.
          </QuietEmpty>
        )
      ) : (
        <>
          <ul className="card dbs-list">
            {doubts.map((doubt) => (
              <DoubtRow key={doubt.id} doubt={doubt} from={tab} />
            ))}
          </ul>
          {tab === "class" && nextBefore && (
            <div className="mt-4">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Gates: class, then parent approval (Class feed, My doubts, threads) ────

function GateLoading() {
  return <p className="db-subtle py-2 text-sm">Loading…</p>;
}

// ─── Page ──────────────────────────────────────────────────────────────────

const Chatbot = lazy(() => import("./Chatbot"));

export default function Doubts({ section = "class" }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const current = id ? "thread" : section;
  // On a thread, the tab marked is the list the student came from.
  const from = location.state?.from === "mine" ? "mine" : "class";

  const [schoolClass, setSchoolClass] = useState(() => getStoredUser()?.schoolClass || "");
  const [consent, setConsent] = useState("loading"); // loading | approved | needed | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getConsent()
      .then((data) => alive && setConsent(data.consent?.status === "approved" ? "approved" : "needed"))
      .catch((err) => {
        if (!alive) return;
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
  const [quota, setQuota] = useState(null);
  // A moderator's mute: reading and Ask AI still work, posting, replying and AI answers do not.
  const [mute, setMute] = useState(() => readMute(null));
  useEffect(() => {
    if (!ready) return;
    getQuota()
      .then((data) => {
        setQuota(data.quota);
        setMute(readMute(data.mute));
      })
      .catch(() => {});
  }, [ready]);

  // The composer lives here, so "Ask your class" is the same on all four
  // pages. A draft from Ask AI ("Still confused? Ask your class") opens it
  // straight away, prefilled, and again after a reload unless the student had
  // closed it. It waits behind the class and parent-approval steps.
  const [draft, setDraft] = useState(readDraft);
  const [draftKey, setDraftKey] = useState(0);
  const [composing, setComposing] = useState(() => Boolean(draft && draft.open !== false));
  const onMuted = useCallback((data) => {
    setMute(readMute(data));
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
    setQuota(data.quota || quota);
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
    content = (
      <Suspense fallback={<GateLoading />}>
        <Chatbot onDraftReady={pickUpDraft} />
      </Suspense>
    );
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
          <ParentApproval onApproved={() => setConsent("approved")} />
        </div>
      </div>
    );
  } else if (current === "thread") {
    content = (
      <DoubtThread
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
        <Button className="min-h-[44px] px-5 py-2 shadow-none" onClick={openComposer} disabled={muted || (hasLeft && left === 0)}>
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
