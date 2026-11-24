// Who may open a lecture's video and images. Decided here on the server; the app's lock icons only mirror it.
//
// Until payments open, every signed in student may open every lecture that has a video. Once PAYMENTS_OPEN=true
// the first two lectures of every chapter stay free and the rest need an active plan.
export const FREE_LECTURES_PER_CHAPTER = 2;

// Lectures are not released yet. While LECTURES_LIVE is not "true", no lecture is playable: the library marks every
// lecture "coming soon" and the lecture call refuses. Set LECTURES_LIVE=true (PRO_LECTURES_LIVE on Vercel) when the
// first medical videos are ready.
export const lecturesLive = () => String(process.env.LECTURES_LIVE || "").trim().toLowerCase() === "true";

export const paymentsOpen = () => String(process.env.PAYMENTS_OPEN || "").trim().toLowerCase() === "true";

const hasActivePlan = (user, now) => {
  if (!user?.subscriptionPurchased) return false;
  if (!user.subscriptionValidTill) return true;
  return new Date(user.subscriptionValidTill).getTime() > now;
};

/** `index` is the lecture's position inside its chapter, starting at 0. */
export function lectureDecision(user, index, now = Date.now()) {
  if (!user) return { allowed: false, reason: "login" };
  if (!lecturesLive()) return { allowed: false, reason: "coming_soon" };
  if (!paymentsOpen()) return { allowed: true, reason: "free-until-payments-open" };
  if (index < FREE_LECTURES_PER_CHAPTER) return { allowed: true, reason: "free" };
  if (hasActivePlan(user, now)) return { allowed: true, reason: "plan" };
  return { allowed: false, reason: "plan" };
}

/**
 * The public version of the library: names, lengths and structure, but never a real video link or image link.
 * A lecture that has a video carries the marker "secure:<id>" so the app can show it as available.
 */
export function publicLibrary(content) {
  return {
    ...content,
    subjects: (content.subjects || []).map((subject) => ({
      ...subject,
      chapters: (subject.chapters || []).map((chapter) => ({
        ...chapter,
        videos: (chapter.videos || []).map((video) => ({
          ...video,
          videoLink: lecturesLive() && String(video.videoLink || "").trim() ? `secure:${video._id}` : "",
          photos: [],
        })),
      })),
    })),
  };
}
