// Builds the real Class VIII to X lesson catalog for the app from Course-Content, and marks which
// lessons already have a finished video (from the manifest). Output: Frontend/src/data/schoolLessons.json
// Usage: node scripts/video/build-catalog.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(here, "../../../../Course-Content/source");
const MANIFEST = path.resolve(here, "../../data/lesson-manifest.json");
const OUT = path.resolve(here, "../../../Frontend/src/data/schoolLessons.json");

// Order and names as students see them in the Library.
const SUBJECTS = [
  ["mathematics", "Mathematics"],
  ["science", "Science"],
  ["social-science", "Social Science"],
  ["english", "English"],
  ["hindi", "Hindi"],
  ["sanskrit", "Sanskrit"],
  ["information-technology", "Information Technology"],
];

const videos = new Map(JSON.parse(fs.readFileSync(MANIFEST, "utf8")).lessons.map((l) => [l.lessonId, l.durationSec]));
const id = (cls, subject, ch, t) => `c${cls}-${subject}-ch${String(ch).padStart(2, "0")}-t${String(t).padStart(2, "0")}`;

const catalog = {};
let topics = 0, withVideo = 0;
for (const cls of [8, 9, 10]) {
  const subjects = [];
  for (const [slug, name] of SUBJECTS) {
    const dir = path.join(CONTENT, `class-${cls}`, slug);
    if (!fs.existsSync(dir)) continue;
    const chapters = new Map();
    for (const file of fs.readdirSync(dir).filter((f) => /^ch\d+\.json$/.test(f)).sort()) {
      for (const t of JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))) {
        if (!chapters.has(t.chapter_no)) chapters.set(t.chapter_no, { no: t.chapter_no, title: t.chapter, topics: [] });
        const seconds = videos.get(id(cls, slug, t.chapter_no, t.topic_no)) || 0;
        chapters.get(t.chapter_no).topics.push([t.topic_no, t.name, seconds]);
        topics++;
        if (seconds) withVideo++;
      }
    }
    subjects.push({ slug, name, chapters: [...chapters.values()].sort((a, b) => a.no - b.no) });
  }
  catalog[cls] = subjects;
}

const unknown = [...videos.keys()].filter((k) => {
  const m = /^c(\d+)-(.+)-ch(\d+)-t(\d+)$/.exec(k);
  return !catalog[m[1]]?.find((s) => s.slug === m[2])?.chapters.find((c) => c.no === +m[3])?.topics.find((t) => t[0] === +m[4]);
});
fs.writeFileSync(OUT, JSON.stringify(catalog));
console.log(`${topics} lessons in the catalog, ${withVideo} with video -> ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log(unknown.length ? `WARNING videos not in catalog: ${unknown.join(", ")}` : "every video is in the catalog");
