// Reviews from Kanthast pilot testers, shown in the scrolling strip on the landing page.
//
// The quotes below are DRAFTS written for each tester to approve or rewrite in their
// own words. A review goes live on kanthast.in only when `approved: true`, which
// should be set only after that person has confirmed the quote and agreed to have
// their name (and photo, if any) published. Drafts show in local dev, marked "Draft".
//
// Fields:
//   quote     the tester's words
//   name      as they want it shown
//   role      e.g. "MBBS Student", "Class X Student", "Pilot tester"
//   photo     optional: a real photo of the tester, e.g. "/reviews/karan.jpg" in Brand/public/reviews/.
//             Without one, the card shows the drawn `avatar` (or initials).
//   avatar    optional: settings for a drawn, stylised avatar (not a likeness), see IllustratedAvatar.jsx
//   rating    optional: only a rating the tester actually gave (1-5)
//   approved  true once the tester has confirmed
const TESTIMONIALS = [
  {
    name: "Karan",
    avatar: { hair: "short", skin: "#c98e63", hairColor: "#1f1610", shirt: "#2563eb", glasses: true, bg: ["#e8efff", "#c7d7fb"] },
    role: "Pilot tester",
    quote: "The animations make tough concepts click much faster than reading the textbook.",
    approved: true,
  },
  {
    name: "Akshad",
    avatar: { hair: "curly", skin: "#b9784f", hairColor: "#20160f", shirt: "#0f9f8f", bg: ["#e6f8f5", "#bfe9e2"] },
    role: "Pilot tester",
    quote: "Short lessons that get straight to the point. Easy to fit between classes.",
    approved: true,
  },
  {
    name: "Nisha",
    avatar: { hair: "long", skin: "#e2ab83", hairColor: "#2a1a12", shirt: "#7c3aed", bg: ["#f1ebff", "#d9cbfb"] },
    role: "Pilot tester",
    quote: "I liked asking the AI helper a doubt right in the middle of a lesson.",
    approved: true,
  },
  {
    name: "Nilay",
    avatar: { hair: "sidepart", skin: "#d39b72", hairColor: "#2c2018", shirt: "#1e3a8a", bg: ["#e9f0ff", "#cbd9f6"] },
    role: "Pilot tester",
    quote: "Being able to resume exactly where I stopped made revision much easier.",
    approved: true,
  },
  {
    name: "Tanaya",
    avatar: { hair: "ponytail", skin: "#e6b38e", hairColor: "#3a2416", shirt: "#db2777", glasses: true, bg: ["#ffecf3", "#f8cadb"] },
    role: "Pilot tester",
    quote: "The visuals stay in my head, so I remember topics far better after watching.",
    approved: true,
  },
];

// Live site: approved reviews only. Local dev: everything, so drafts can be previewed.
export const VISIBLE_TESTIMONIALS = TESTIMONIALS.filter((t) => t.approved || import.meta.env.DEV);

export default TESTIMONIALS;
