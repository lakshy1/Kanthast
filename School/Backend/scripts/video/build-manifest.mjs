// Maps every finished School video on disk to its real lesson in Course-Content.
// Usage: node scripts/video/build-manifest.mjs "<videos dir>/Kanthast-School"
// The match comes from the folder path (class / subject / "N. Chapter" / "NN-Topic"), not the
// file name, because file names are not consistent. The topic title is checked against the
// script data so a wrong folder is reported instead of silently attached to the wrong lesson.
import fs from "fs";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ffmpeg = createRequire(import.meta.url)("ffmpeg-static");

// ffmpeg prints "Duration: 00:02:05.77" on stderr when asked to read a file.
function durationSeconds(file) {
  let text = "";
  try {
    execFileSync(ffmpeg, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (error) {
    text = String(error.stderr || "");
  }
  const m = /Duration: (\d+):(\d+):(\d+\.?\d*)/.exec(text);
  return m ? Math.round(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) : 0;
}
const CONTENT = path.resolve(here, "../../../../Course-Content/source");
const OUT = path.resolve(here, "../../data/lesson-manifest.json");

const CLASS_DIRS = { "Class VIII": 8, "Class IX": 9, "Class X": 10 };
const SUBJECT_SLUGS = {
  Science: "science",
  Mathematics: "mathematics",
  English: "english",
  Hindi: "hindi",
  Sanskrit: "sanskrit",
  "Social Science": "social-science",
  "Information Technology": "information-technology",
};
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const lessonIdFor = (cls, subject, chapterNo, topicNo) =>
  `c${cls}-${subject}-ch${String(chapterNo).padStart(2, "0")}-t${String(topicNo).padStart(2, "0")}`;

function loadScripts(cls, subject) {
  const dir = path.join(CONTENT, `class-${cls}`, subject);
  const byKey = new Map();
  if (!fs.existsSync(dir)) return byKey;
  for (const file of fs.readdirSync(dir).filter((f) => /^ch\d+\.json$/.test(f))) {
    for (const t of JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))) {
      byKey.set(`${t.chapter_no}:${t.topic_no}`, t);
    }
  }
  return byKey;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.toLowerCase().endsWith(".mp4") ? [p] : [];
  });
}

const root = process.argv[2];
if (!root) throw new Error('Pass the "Kanthast-School" videos folder.');
const lessons = [];
const problems = [];
const cache = new Map();

for (const file of walk(root)) {
  const rel = path.relative(root, file).split(path.sep);
  const [classDir, subjectDir, chapterDir, topicDir] = rel;
  const cls = CLASS_DIRS[classDir];
  const subject = SUBJECT_SLUGS[subjectDir];
  const chapterNo = Number((/^(\d+)\./.exec(chapterDir) || [])[1]);
  const topicMatch = /^(\d+)-(.*)$/.exec(topicDir || "");
  const topicNo = topicMatch ? Number(topicMatch[1]) : NaN;
  if (!cls || !subject || !chapterNo || !topicNo) {
    problems.push(`cannot read path: ${rel.join("/")}`);
    continue;
  }
  const key = `${cls}:${subject}`;
  if (!cache.has(key)) cache.set(key, loadScripts(cls, subject));
  const script = cache.get(key).get(`${chapterNo}:${topicNo}`);
  if (!script) {
    problems.push(`no script for ${classDir} ${subjectDir} ch${chapterNo} t${topicNo}: ${rel.join("/")}`);
    continue;
  }
  if (norm(script.name) !== norm(topicMatch[2])) {
    problems.push(`title differs: folder "${topicMatch[2]}" vs script "${script.name}" (${classDir} ${subjectDir} ch${chapterNo} t${topicNo})`);
  }
  lessons.push({
    lessonId: lessonIdFor(cls, subject, chapterNo, topicNo),
    class: cls,
    subject,
    chapterNo,
    topicNo,
    chapter: script.chapter,
    title: script.name,
    durationSec: durationSeconds(file),
    source: path.relative(root, file),
  });
}

lessons.sort((a, b) => a.lessonId.localeCompare(b.lessonId));
const dupes = lessons.filter((l, i) => lessons.findIndex((x) => x.lessonId === l.lessonId) !== i);
if (dupes.length) problems.push(`duplicate lessons: ${dupes.map((d) => d.lessonId).join(", ")}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedFrom: "Kanthast-School", lessons }, null, 2));
console.log(`${lessons.length} videos mapped to lessons -> ${path.relative(process.cwd(), OUT)}`);
console.log(problems.length ? `${problems.length} problem(s):\n  ` + problems.join("\n  ") : "no problems");
