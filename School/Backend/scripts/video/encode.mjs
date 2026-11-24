// Encodes the mapped School videos into encrypted, adaptive HLS (480p, 720p, 1080p).
// Usage: node scripts/video/encode.mjs "<videos dir>/Kanthast-School" [outputDir] [onlyLessonId]
// Safe to re-run: lessons already encoded are skipped.
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { lessonKey, lessonIv } from "../../utils/videoKeys.js";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"), quiet: true });
const ffmpeg = require("ffmpeg-static");
const run = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.resolve(here, "../../data/lesson-manifest.json"), "utf8")).lessons;
const [, , sourceRoot, outArg, only] = process.argv;
if (!sourceRoot) throw new Error('Usage: encode.mjs "<videos dir>/Kanthast-School" [outputDir] [lessonId]');
const outRoot = outArg || path.join(os.homedir(), "Projects", "kanthast-encoded", "hls");
const KEY_URI = "KEY_URI_PLACEHOLDER"; // the server swaps this for a signed link when it serves the playlist

// Quality based (CRF) with a bitrate ceiling. The cartoons are flat colour, so they look clean at a
// fraction of the usual streaming bitrates; the ceilings only matter for the busiest scenes.
const LADDER = [
  { h: 1080, crf: 23, max: "2600k", buf: "5200k" },
  { h: 720, crf: 23, max: "1500k", buf: "3000k" },
  { h: 480, crf: 24, max: "800k", buf: "1600k" },
];

async function encode(lesson) {
  const dir = path.join(outRoot, lesson.lessonId);
  if (fs.existsSync(path.join(dir, "master.m3u8")) && fs.existsSync(path.join(dir, "done"))) return "skipped";
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const keyFile = path.join(dir, "enc.key");
  const infoFile = path.join(dir, "enc.keyinfo");
  fs.writeFileSync(keyFile, lessonKey(process.env.VIDEO_KEY_SECRET, lesson.lessonId));
  fs.writeFileSync(infoFile, `${KEY_URI}\n${keyFile}\n${lessonIv(process.env.VIDEO_KEY_SECRET, lesson.lessonId).toString("hex")}\n`);

  const split = LADDER.map((_, i) => `[v${i}]`).join("");
  const filter =
    `[0:v]split=${LADDER.length}${split};` +
    LADDER.map((r, i) => `[v${i}]scale=-2:${r.h}:flags=lanczos[o${i}]`).join(";");
  const args = ["-y", "-loglevel", "error", "-i", path.join(sourceRoot, lesson.source), "-filter_complex", filter];
  LADDER.forEach((r, i) => {
    args.push("-map", `[o${i}]`, "-map", "0:a:0");
    args.push(`-c:v:${i}`, "libx264", `-profile:v:${i}`, "main", `-crf:v:${i}`, String(r.crf), `-maxrate:v:${i}`, r.max, `-bufsize:v:${i}`, r.buf);
  });
  args.push("-preset", "medium", "-pix_fmt", "yuv420p", "-force_key_frames", "expr:gte(t,n_forced*4)", "-sc_threshold", "0");
  args.push("-c:a", "aac", "-b:a", "128k", "-ac", "2");
  args.push(
    "-f", "hls", "-hls_time", "4", "-hls_playlist_type", "vod", "-hls_flags", "independent_segments",
    "-hls_key_info_file", infoFile,
    "-hls_segment_filename", path.join(dir, "v%v", "seg_%04d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", LADDER.map((_, i) => `v:${i},a:${i}`).join(" "),
    path.join(dir, "v%v", "index.m3u8")
  );
  LADDER.forEach((_, i) => fs.mkdirSync(path.join(dir, `v${i}`), { recursive: true }));
  await run(ffmpeg, args, { maxBuffer: 1024 * 1024 * 64 });

  fs.rmSync(keyFile); // the key is derived on demand; never leave it next to the segments
  fs.rmSync(infoFile);
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ lessonId: lesson.lessonId, renditions: LADDER.map((r) => r.h) }));
  fs.writeFileSync(path.join(dir, "done"), "");
  return "encoded";
}

const todo = manifest.filter((l) => !only || l.lessonId === only);
console.log(`${todo.length} lesson(s) -> ${outRoot}`);
let index = 0, done = 0;
const started = Date.now();
async function worker() {
  while (index < todo.length) {
    const lesson = todo[index++];
    try {
      const result = await encode(lesson);
      done++;
      console.log(`[${done}/${todo.length}] ${result}: ${lesson.lessonId}  (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (error) {
      console.error(`FAILED ${lesson.lessonId}: ${String(error.stderr || error.message).slice(0, 300)}`);
      process.exitCode = 1;
    }
  }
}
await Promise.all([worker(), worker()]);
console.log(`finished in ${Math.round((Date.now() - started) / 1000)}s`);
