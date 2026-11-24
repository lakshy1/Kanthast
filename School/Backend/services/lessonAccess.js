import { isPaid } from "./doubtQuota.js";

// Lesson ids look like "c10-science-ch01-t03": class, subject, chapter and topic number.
const LESSON_ID = /^c(8|9|10)-([a-z]+(?:-[a-z]+)*)-ch(\d{2})-t(\d{2})$/;

// The first two topics of every chapter are free for any signed in student.
export const FREE_TOPICS_PER_CHAPTER = 2;

// Until payments open, every lesson that has a video is free for any signed in student. Flip this on
// the server (PAYMENTS_OPEN=true) together with PAYMENTS_OPEN in Frontend/src/config/launch.js.
export const paymentsOpen = () => String(process.env.PAYMENTS_OPEN || "").trim().toLowerCase() === "true";

export function parseLessonId(id) {
  const m = LESSON_ID.exec(String(id || ""));
  if (!m) return null;
  return { id, classNo: Number(m[1]), subject: m[2], chapter: Number(m[3]), topic: Number(m[4]) };
}

/**
 * Who may watch a lesson. Signed out: nobody (the watermark needs a name). While payments are closed every
 * signed in student may watch every lesson that exists. Once open: the first two topics of each chapter are
 * free and the rest need an active plan for that lesson's class.
 */
export function playbackDecision(user, lesson, now = Date.now()) {
  if (!user) return { allowed: false, reason: "login" };
  if (!lesson) return { allowed: false, reason: "unknown" };
  if (!paymentsOpen()) return { allowed: true, reason: "free-until-payments-open" };
  if (lesson.topic <= FREE_TOPICS_PER_CHAPTER) return { allowed: true, reason: "free" };
  if (isPaid(user, now) && String(user.schoolClass) === String(lesson.classNo)) return { allowed: true, reason: "plan" };
  return { allowed: false, reason: "plan" };
}
