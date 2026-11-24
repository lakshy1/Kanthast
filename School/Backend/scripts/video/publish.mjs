// One command to publish new School lessons.
//   npm run video:publish -- ["<path to the Kanthast-School videos folder>"]
// It maps every video to its lesson, encodes the new ones (finished ones are skipped), uploads them to the
// private bucket and registers them, so they appear in the library and the admin panel straight away.
// Put HIDE=1 in front to upload without publishing; use the admin panel's Videos tab to make them live later.
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source =
  process.argv[2] ||
  process.env.KANTHAST_SCHOOL_VIDEOS ||
  path.join(os.homedir(), "Projects", "data-backup", "Personal", "Videos", "Desktop", "Kanthast Videos", "Kanthast-School");

const steps = [
  ["Matching videos to lessons", "build-manifest.mjs", [source]],
  ["Updating the lesson catalog", "build-catalog.mjs", []],
  ["Encoding (finished lessons are skipped)", "encode.mjs", [source]],
  ["Uploading and registering", "upload.mjs", []],
];

for (const [label, script, args] of steps) {
  console.log(`\n== ${label}`);
  const run = spawnSync(process.execPath, [path.join(here, script), ...args], { stdio: "inherit" });
  if (run.status !== 0) {
    console.error(`\nStopped: "${label}" failed. Fix that and run the command again; finished work is kept.`);
    process.exit(run.status || 1);
  }
}
console.log("\nDone. New lessons are live (unless HIDE=1).");
