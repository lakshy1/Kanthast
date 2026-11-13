// Moves Kanthast School accounts out of the Professional database.
//
// Before the split both products shared one database, and School users were
// marked with `track: "school"`. Professional must not hold those accounts,
// so this copies them (with their Profile, sessions and AI video jobs) into
// the School database and then deletes them from the Professional one.
//
//   node scripts/split-school-users.js            dry run: counts only, writes nothing
//   node scripts/split-school-users.js --apply    copy to School, then delete from Professional
//
// Reads MONGODB_URL / MONGODB_DB from ./.env (source) and ../../School/Backend/.env (target).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const here = path.dirname(fileURLToPath(import.meta.url));
const readEnv = (file) =>
  Object.fromEntries(
    fs.readFileSync(file, "utf8").split("\n")
      .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.trim().replace(/^["']|["']$/g, "")])
  );

const src = readEnv(path.join(here, "../.env"));
const dst = readEnv(path.join(here, "../../../School/Backend/.env"));
const apply = process.argv.includes("--apply");

const srcClient = new MongoClient(src.MONGODB_URL);
const dstClient = new MongoClient(dst.MONGODB_URL);

try {
  await srcClient.connect();
  await dstClient.connect();
  const s = srcClient.db(src.MONGODB_DB || undefined);
  const d = dstClient.db(dst.MONGODB_DB || "kanthast_school");
  if (s.databaseName === d.databaseName && src.MONGODB_URL === dst.MONGODB_URL) {
    throw new Error("Source and target are the same database; refusing to run.");
  }

  const users = await s.collection("users").find({ track: "school" }).toArray();
  const userIds = users.map((u) => u._id);
  const profileIds = users.map((u) => u.additionalDetails).filter(Boolean);
  const emails = users.map((u) => u.email);

  const profiles = await s.collection("profiles").find({ _id: { $in: profileIds } }).toArray();
  const sessions = await s.collection("usersessions").find({ user: { $in: userIds } }).toArray();
  const jobs = await s.collection("videogenerations").find({ user: { $in: userIds } }).toArray();
  const clashes = await d.collection("users").countDocuments({ email: { $in: emails } });
  const totalSrc = await s.collection("users").countDocuments();

  console.log(`Professional DB: ${s.databaseName} (${totalSrc} users)`);
  console.log(`School DB:       ${d.databaseName}`);
  console.log(`School users to move: ${users.length}`);
  console.log(`  profiles ${profiles.length}, sessions ${sessions.length}, AI video jobs ${jobs.length}`);
  console.log(`  already in School DB by email: ${clashes}`);

  if (!apply) {
    console.log("\nDry run. Nothing written. Re-run with --apply to move them.");
    process.exit(0);
  }

  const copy = async (name, docs) => {
    if (!docs.length) return;
    await d.collection(name).bulkWrite(
      docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } }))
    );
  };
  await copy("profiles", profiles);
  await copy("users", users.map(({ track, ...rest }) => rest));
  await copy("usersessions", sessions);
  await copy("videogenerations", jobs);

  // Verify every user landed before deleting anything from Professional.
  const landed = await d.collection("users").countDocuments({ _id: { $in: userIds } });
  if (landed !== users.length) throw new Error(`Only ${landed}/${users.length} users copied; nothing deleted.`);

  await s.collection("usersessions").deleteMany({ user: { $in: userIds } });
  await s.collection("videogenerations").deleteMany({ user: { $in: userIds } });
  await s.collection("profiles").deleteMany({ _id: { $in: profileIds } });
  await s.collection("users").deleteMany({ _id: { $in: userIds } });
  await s.collection("users").updateMany({ track: { $exists: true } }, { $unset: { track: "", schoolClass: "" } });

  console.log(`\nMoved ${users.length} School users out of Professional.`);
} finally {
  await srcClient.close();
  await dstClient.close();
}
