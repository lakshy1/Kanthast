import MedicineUSMLE from "../models/MedicineUSMLE.js";

// Finds where a lecture sits in its chapter (the position decides whether it is free). The library is read from
// the database at most once a minute per server instance; playlists and keys ask for this on every request.
const LECTURE_ID = /^[a-f0-9]{24}$/i;
const TTL_MS = 60_000;
let cache = { at: 0, positions: new Map() };

export const parseLectureId = (id) => (LECTURE_ID.test(String(id || "")) ? { id: String(id).toLowerCase() } : null);

async function positions() {
  if (Date.now() - cache.at < TTL_MS) return cache.positions;
  const content = await MedicineUSMLE.findOne({ courseKey: "medicine-usmle" }).lean();
  const map = new Map();
  for (const subject of content?.subjects || []) {
    for (const chapter of subject.chapters || []) {
      const ordered = [...(chapter.videos || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      ordered.forEach((video, index) => map.set(String(video._id).toLowerCase(), index));
    }
  }
  cache = { at: Date.now(), positions: map };
  return map;
}

/** { id, index } for a lecture that exists in the library, otherwise null. */
export async function locateLecture(id) {
  const lecture = parseLectureId(id);
  if (!lecture) return null;
  const index = (await positions()).get(lecture.id);
  return index === undefined ? null : { ...lecture, index };
}

/** Forget what was read (after the admin edits the library). */
export const forgetLectureLocations = () => {
  cache = { at: 0, positions: new Map() };
};
