// Prints every lecture in the Medicine library with its id, so you know which id a video belongs to.
// Usage: node scripts/video/list.mjs
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"), quiet: true });
const { connectDB } = await import("../../config/database.js");
const { default: MedicineUSMLE } = await import("../../models/MedicineUSMLE.js");
const { default: LectureVideo } = await import("../../models/LectureVideo.js");
const mongoose = require("mongoose");

await connectDB();
const live = new Map((await LectureVideo.find().lean()).map((r) => [String(r.lectureId), r.status]));
const content = await MedicineUSMLE.findOne({ courseKey: "medicine-usmle" }).lean();
for (const subject of content?.subjects || []) {
  for (const chapter of subject.chapters || []) {
    for (const video of [...(chapter.videos || [])].sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const id = String(video._id);
      console.log(`${id}\t${live.get(id) || "no video"}\t${subject.name} / ${chapter.name} / ${video.name}`);
    }
  }
}
await mongoose.disconnect();
