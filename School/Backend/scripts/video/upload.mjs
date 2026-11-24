// Uploads encoded lessons to the private R2 bucket under lessons/<lessonId>/...
// Usage: node scripts/video/upload.mjs [encodedDir] [onlyLessonId]
// Safe to re-run: files already in the bucket with the same size are skipped.
// After uploading, each lesson is registered in the database (LessonVideo), which is what makes it appear
// in the library. Use HIDE=1 to upload without publishing.
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"), quiet: true });
const { PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { r2, r2Config } = await import("../../config/r2.js");

const [, , dirArg, only] = process.argv;
const root = dirArg || path.join(os.homedir(), "Projects", "kanthast-encoded", "hls");
const { bucket } = r2Config();
const client = r2();
const types = { ".m3u8": "application/vnd.apple.mpegurl", ".ts": "video/mp2t", ".json": "application/json" };

const lessons = fs.readdirSync(root).filter((id) => (!only || id === only) && fs.existsSync(path.join(root, id, "done")));
const files = lessons.flatMap((id) =>
  fs.readdirSync(path.join(root, id), { recursive: true })
    .filter((rel) => !["done", "meta.json"].includes(rel) && fs.statSync(path.join(root, id, rel)).isFile())
    .map((rel) => ({ id, rel: rel.split(path.sep).join("/"), file: path.join(root, id, rel) }))
);
console.log(`${lessons.length} lesson(s), ${files.length} file(s) -> bucket ${bucket}`);

let next = 0, sent = 0, skipped = 0, bytes = 0, failed = 0;
async function worker() {
  while (next < files.length) {
    const f = files[next++];
    const key = `lessons/${f.id}/${f.rel}`;
    const size = fs.statSync(f.file).size;
    try {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        if (head.ContentLength === size) { skipped++; continue; }
      } catch { /* not there yet */ }
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: fs.readFileSync(f.file), ContentType: types[path.extname(f.rel)] || "application/octet-stream", CacheControl: "private, max-age=0" }));
      sent++; bytes += size;
    } catch (error) {
      failed++; console.error(`FAILED ${key}: ${error.name}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`uploaded ${sent} (${(bytes / 1e6).toFixed(1)} MB), already there ${skipped}, failed ${failed}`);

if (!failed && lessons.length && process.env.HIDE !== "1") {
  const { connectDB } = await import("../../config/database.js");
  const { default: LessonVideo } = await import("../../models/LessonVideo.js");
  const mongoose = require("mongoose");
  await connectDB();
  const manifest = new Map(JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/lesson-manifest.json"), "utf8")).lessons.map((l) => [l.lessonId, l.durationSec]));
  let registered = 0;
  for (const id of lessons) {
    await LessonVideo.updateOne({ lessonId: id }, { $set: { durationSec: manifest.get(id) || 0 }, $setOnInsert: { status: "live", publishedAt: new Date() } }, { upsert: true });
    registered++;
  }
  console.log(`registered ${registered} lesson(s) in the library (live)`);
  await mongoose.disconnect();
}
process.exitCode = failed ? 1 : 0;
