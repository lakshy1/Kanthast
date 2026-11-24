// Makes the small public images and the hero clip from the finished videos:
//   - a thumbnail for every lesson that has a video   -> Frontend/public/lesson-thumbs/<lessonId>.webp
//   - a short silent hero loop for the homepage       -> Frontend/public/hero-lesson.mp4 (+ poster .webp)
// Usage: node scripts/video/media.mjs "<videos dir>/Kanthast-School" [thumbs|hero]
// These are single frames and a 12 second excerpt, not the lessons. Safe to re-run: existing thumbnails are kept.
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ffmpeg = createRequire(import.meta.url)("ffmpeg-static");
const manifest = JSON.parse(fs.readFileSync(path.resolve(here, "../../data/lesson-manifest.json"), "utf8")).lessons;
const publicDir = path.resolve(here, "../../../Frontend/public");
const [, , root, only] = process.argv;
if (!root) throw new Error('Usage: media.mjs "<videos dir>/Kanthast-School" [thumbs|hero]');
const run = (args) => execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...args], { stdio: ["ignore", "ignore", "inherit"] });

if (!only || only === "thumbs") {
  const dir = path.join(publicDir, "lesson-thumbs");
  fs.mkdirSync(dir, { recursive: true });
  let made = 0;
  for (const lesson of manifest) {
    const out = path.join(dir, `${lesson.lessonId}.webp`);
    if (fs.existsSync(out)) continue;
    // A frame about a third in is usually past the title card and shows the characters.
    const at = Math.max(1, Math.round((lesson.durationSec || 60) * 0.33));
    run(["-ss", String(at), "-i", path.join(root, lesson.source), "-frames:v", "1", "-vf", "scale=480:-2", "-c:v", "libwebp", "-quality", "72", out]);
    made++;
  }
  console.log(`thumbnails: made ${made}, ${manifest.length} total in ${path.relative(process.cwd(), dir)}`);
}

if (!only || only === "hero") {
  const lesson = manifest.find((l) => l.lessonId === "c8-science-ch01-t01");
  if (lesson) {
    const src = path.join(root, lesson.source);
    run(["-ss", "8", "-t", "12", "-i", src, "-an", "-vf", "scale=960:-2", "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(publicDir, "hero-lesson.mp4")]);
    run(["-ss", "10", "-i", src, "-frames:v", "1", "-vf", "scale=960:-2", "-c:v", "libwebp", "-quality", "78", path.join(publicDir, "hero-lesson.webp")]);
    const kb = (f) => Math.round(fs.statSync(path.join(publicDir, f)).size / 1024);
    console.log(`hero clip: hero-lesson.mp4 ${kb("hero-lesson.mp4")} KB, poster ${kb("hero-lesson.webp")} KB`);
  }
}
