// Which story a page tells. One map, read by the navbar, mobile dock, footer and library.
//
//   brand        Kanthast itself: the home page and everything shared by both products
//                (About, Contact, legal pages, 404). Never borrows a track.
//   professional Kanthast Professional: NEET PG, INI CET and USMLE.
//   school       Kanthast School: Classes 1 to 10.
//
// Marketing routes decide by URL. The signed-in app (dashboard, library, lessons, ...)
// has no track in its URL, so there the account's own track decides.

export const CONTEXTS = {
  brand: { id: "brand", name: "Kanthast", home: "/" },
  professional: {
    id: "professional",
    name: "Kanthast Professional",
    short: "Professional",
    tagline: "NEET PG · INI CET · USMLE",
    home: "/professional",
    courses: "/courses",
    library: "/professional/library",
    pricing: "/pricing",
    login: "/login",
    signup: "/signup",
    track: "medical",
  },
  school: {
    id: "school",
    name: "Kanthast School",
    short: "School",
    tagline: "Classes 1 to 10",
    home: "/school",
    courses: "/school/courses",
    library: "/school/library",
    pricing: "/school#pricing",
    login: "/school/login",
    signup: "/school/signup",
    track: "school",
  },
};

const PROFESSIONAL_PATHS = ["/professional", "/courses", "/pricing", "/login", "/signup"];
// Signed-in app pages: same URL for both tracks.
const APP_PATHS = ["/dashboard", "/profile", "/settings", "/lists", "/summary", "/video", "/images", "/chatbot", "/subscription"];

const under = (pathname, root) => pathname === root || pathname.startsWith(`${root}/`);

/** "school" | "medical" stored track (account or last visited) -> context id. */
export const contextForTrack = (track) => (track === "school" ? "school" : "professional");

/**
 * The context for a route. `user` is the signed-in user (or null); `ambientTrack` is the
 * last track a signed-out visitor browsed, used only for app pages reached without one.
 */
export function contextForPath(pathname, user = null, ambientTrack = "medical") {
  if (under(pathname, "/school")) return "school";
  if (PROFESSIONAL_PATHS.some((p) => under(pathname, p))) return "professional";
  if (APP_PATHS.some((p) => under(pathname, p))) return contextForTrack(user?.track || ambientTrack);
  return "brand";
}
