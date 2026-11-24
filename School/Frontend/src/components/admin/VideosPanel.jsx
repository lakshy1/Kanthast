import { useCallback, useEffect, useState } from "react";
import { FaVideo } from "react-icons/fa";
import { EmptyState } from "../ui";
import { lessonLabel } from "../../utils/schoolCatalogData";
import { getLiveLessons, getPlaybackLogs, getPlaybackSummary, setLessonStatus } from "../../utils/adminVideoApi";

const minutes = (seconds) => `${Math.round((seconds || 0) / 60)} min`;
const when = (value) => (value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const device = (ua = "") => (/iPhone|iPad/.test(ua) ? "iPhone or iPad" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : ua ? "Other" : "");

/** Admin: which lessons are live, who has been watching, and a switch to hide a lesson. */
export default function VideosPanel() {
  const [state, setState] = useState({ loading: true, error: "", lessons: [], logs: [], summary: null });
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [lessons, logs, summary] = await Promise.all([getLiveLessons(), getPlaybackLogs(100), getPlaybackSummary()]);
      setState({ loading: false, error: "", lessons: lessons.lessons, logs: logs.logs, summary });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (lesson) => {
    setBusy(lesson.lessonId);
    try {
      await setLessonStatus(lesson.lessonId, lesson.status === "live" ? "hidden" : "live");
      await load();
    } catch (error) {
      setState((s) => ({ ...s, error: error.message }));
    } finally {
      setBusy("");
    }
  };

  const { loading, error, lessons, logs, summary } = state;
  const live = lessons.filter((l) => l.status === "live").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-ink">Videos</h2>
        <p className="mt-1 text-ink-muted">
          {loading ? "Loading..." : `${live} live, ${lessons.length - live} hidden. Add new lessons with the upload script; they appear here and in the library straight away.`}
        </p>
      </div>

      {error && <EmptyState variant="error" icon={FaVideo} title="Could not load videos" description={error} action="Try again" onAction={load} />}

      {summary && (
        <p className="text-ink">
          <strong className="tabular-nums">{summary.totalViews}</strong> plays in the last {summary.days} days.
        </p>
      )}

      <section aria-labelledby="live-lessons">
        <h3 id="live-lessons" className="text-lg font-bold text-ink">Lessons</h3>
        {lessons.length === 0 && !loading && !error ? (
          <p className="mt-2 text-ink-muted">No lessons registered yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-ink-muted">
                <tr><th className="p-3">Lesson</th><th className="p-3">Length</th><th className="p-3">Plays (30 days)</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const stats = summary?.perLesson.find((p) => p.lessonId === lesson.lessonId);
                  return (
                    <tr key={lesson.lessonId} className="border-t border-line">
                      <td className="p-3 text-ink">{lessonLabel(lesson.lessonId)}</td>
                      <td className="p-3 tabular-nums">{minutes(lesson.durationSec)}</td>
                      <td className="p-3 tabular-nums">{stats ? `${stats.views} (${stats.students} students)` : "0"}</td>
                      <td className="p-3">{lesson.status === "live" ? "Live" : "Hidden"}</td>
                      <td className="p-3 text-right">
                        <button type="button" disabled={busy === lesson.lessonId} onClick={() => toggle(lesson)} className="btn-secondary">
                          {lesson.status === "live" ? "Hide" : "Make live"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="watch-log">
        <h3 id="watch-log" className="text-lg font-bold text-ink">Watch log</h3>
        <p className="mt-1 text-sm text-ink-muted">Newest first. If a recording leaks, match the name and last four phone digits in its watermark to a row here.</p>
        {logs.length === 0 && !loading ? (
          <p className="mt-2 text-ink-muted">Nobody has watched a lesson yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-ink-muted">
                <tr><th className="p-3">Started</th><th className="p-3">Student</th><th className="p-3">Phone</th><th className="p-3">Lesson</th><th className="p-3">Watched</th><th className="p-3">Device</th><th className="p-3">IP</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-line align-top">
                    <td className="p-3 whitespace-nowrap">{when(log.startedAt)}</td>
                    <td className="p-3 text-ink">{log.student}<br /><span className="text-ink-muted">{log.email}</span></td>
                    <td className="p-3 tabular-nums">{log.phoneLast4 ? `•••• ${log.phoneLast4}` : ""}</td>
                    <td className="p-3">{lessonLabel(log.lessonId)}</td>
                    <td className="p-3 tabular-nums">{minutes(log.watchedSeconds)}</td>
                    <td className="p-3">{device(log.device)}</td>
                    <td className="p-3 tabular-nums">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
