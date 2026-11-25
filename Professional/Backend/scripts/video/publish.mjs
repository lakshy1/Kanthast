// Encodes a lecture video into encrypted, adaptive HLS (480p, 720p, 1080p), uploads it to the private R2 bucket
// under lectures/<lectureId>/ and registers it, so it plays through the protected player.
//
//   node scripts/video/publish.mjs <lectureId> <video file>
//   node scripts/video/publish.mjs --map lectures.json        (a JSON object: { "<lectureId>": "<video file>", ... })
//
// Find lecture ids with: node scripts/video/list.mjs
// HIDE=1 uploads without making the lecture live (use the admin API to make it live later).
// Safe to re-run: files already in the bucket with the same size are skipped.
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { lectureKey, lectureIv } from "../../utils/videoKeys.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(here, "../../.env"), quiet: true });
const ffmpeg = require("ffmpeg-static");
const { PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { r2, r2Config } = await import("../../config/r2.js");
const run = promisify(execFile);

const args = process.argv.slice(2);
let jobs;
if (args[0] === "--map") jobs = Object.entries(JSON.parse(fs.readFileSync(args[1], "utf8")));
else if (args.length === 2) jobs = [[args[0], args[1]]];
else throw new Error("Usage: publish.mjs <lectureId> <video file>   or   publish.mjs --map lectures.json");
for (const [id, file] of jobs) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new Error(`Not a lecture id: ${id}`);
  if (!fs.existsSync(file)) throw new Error(`Video file not found: ${file}`);
}
if (!process.env.VIDEO_KEY_SECRET || process.env.VIDEO_KEY_SECRET.length < 32) throw new Error("Set VIDEO_KEY_SECRET (at least 32 characters) in .env first.");

const outRoot = path.join(os.homedir(), "Projects", "kanthast-encoded", "pro-hls");
const KEY_URI = "KEY_URI_PLACEHOLDER"; // the server swaps this for a link back to itself when it serves the playlist
const LADDER = [
  { h: 1080, crf: 23, max: "2600k", buf: "5200k" },
  { h: 720, crf: 23, max: "1500k", buf: "3000k" },
  { h: 480, crf: 24, max: "800k", buf: "1600k" },
];
const types = { ".m3u8": "application/vnd.apple.mpegurl", ".ts": "video/mp2t" };

async function durationSeconds(file) {
  const result = await run(ffmpeg, ["-i", file]).catch((e) => e); // ffmpeg exits non zero with no output file; the info is on stderr
  const m = /Duration: (\d+):(\d+):(\d+)/.exec(String(result.stderr || ""));
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function encode(id, source) {
  const dir = path.join(outRoot, id.toLowerCase());
  if (fs.existsSync(path.join(dir, "done"))) return "skipped";
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const keyFile = path.join(dir, "enc.key");
  const infoFile = path.join(dir, "enc.keyinfo");
  fs.writeFileSync(keyFile, lectureKey(process.env.VIDEO_KEY_SECRET, id.toLowerCase()));
  fs.writeFileSync(infoFile, `${KEY_URI}\n${keyFile}\n${lectureIv(process.env.VIDEO_KEY_SECRET, id.toLowerCase()).toString("hex")}\n`);
  const split = LADDER.map((_, i) => `[v${i}]`).join("");
  const filter = `[0:v]split=${LADDER.length}${split};` + LADDER.map((r, i) => `[v${i}]scale=-2:${r.h}:flags=lanczos[o${i}]`).join(";");
  const ffArgs = ["-y", "-loglevel", "error", "-i", source, "-filter_complex", filter];
  LADDER.forEach((r, i) => {
    ffArgs.push("-map", `[o${i}]`, "-map", "0:a:0");
    ffArgs.push(`-c:v:${i}`, "libx264", `-profile:v:${i}`, "main", `-crf:v:${i}`, String(r.crf), `-maxrate:v:${i}`, r.max, `-bufsize:v:${i}`, r.buf);
  });
  ffArgs.push("-preset", "medium", "-pix_fmt", "yuv420p", "-force_key_frames", "expr:gte(t,n_forced*4)", "-sc_threshold", "0");
  ffArgs.push("-c:a", "aac", "-b:a", "128k", "-ac", "2");
  ffArgs.push(
    "-f", "hls", "-hls_time", "4", "-hls_playlist_type", "vod", "-hls_flags", "independent_segments",
    "-hls_key_info_file", infoFile,
    "-hls_segment_filename", path.join(dir, "v%v", "seg_%04d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", LADDER.map((_, i) => `v:${i},a:${i}`).join(" "),
    path.join(dir, "v%v", "index.m3u8")
  );
  LADDER.forEach((_, i) => fs.mkdirSync(path.join(dir, `v${i}`), { recursive: true }));
  await run(ffmpeg, ffArgs, { maxBuffer: 1024 * 1024 * 64 });
  fs.rmSync(keyFile); // the key is derived on demand; never leave it next to the segments
  fs.rmSync(infoFile);
  fs.writeFileSync(path.join(dir, "done"), "");
  return "encoded";
}

const { bucket } = r2Config();
const client = r2();
async function upload(id) {
  const dir = path.join(outRoot, id.toLowerCase());
  const files = fs.readdirSync(dir, { recursive: true }).filter((rel) => rel !== "done" && fs.statSync(path.join(dir, rel)).isFile());
  let sent = 0, skipped = 0;
  for (const rel of files) {
    const posix = rel.split(path.sep).join("/");
    const key = `lectures/${id.toLowerCase()}/${posix}`;
    const size = fs.statSync(path.join(dir, rel)).size;
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (head.ContentLength === size) { skipped++; continue; }
    } catch { /* not there yet */ }
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: fs.readFileSync(path.join(dir, rel)), ContentType: types[path.extname(rel)] || "application/octet-stream", CacheControl: "private, max-age=0" }));
    sent++;
  }
  return { sent, skipped };
}

const done = [];
for (const [id, file] of jobs) {
  try {
    const result = await encode(id, file);
    const up = await upload(id);
    done.push({ id: id.toLowerCase(), durationSec: await durationSeconds(file) });
    console.log(`${id}: ${result}, uploaded ${up.sent} file(s), already there ${up.skipped}`);
  } catch (error) {
    console.error(`FAILED ${id}: ${String(error.stderr || error.message).slice(0, 300)}`);
    process.exitCode = 1;
  }
}

if (done.length && process.env.HIDE !== "1") {
  const { connectDB } = await import("../../config/database.js");
  const { default: LectureVideo } = await import("../../models/LectureVideo.js");
  const mongoose = require("mongoose");
  await connectDB();
  for (const d of done) {
    await LectureVideo.updateOne({ lectureId: d.id }, { $set: { durationSec: d.durationSec }, $setOnInsert: { status: "live", publishedAt: new Date() } }, { upsert: true });
  }
  console.log(`registered ${done.length} lecture(s) as live`);
  await mongoose.disconnect();
}
