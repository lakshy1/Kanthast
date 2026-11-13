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
//             Without one, the card shows their initials.
//   rating    optional: only a rating the tester actually gave (1-5)
//   approved  true once the tester has confirmed
const TESTIMONIALS = [
  {
    name: "Karan",
    role: "Pilot tester",
    quote: "The animations make tough concepts click much faster than reading the textbook.",
    approved: false,
  },
  {
    name: "Akshad",
    role: "Pilot tester",
    quote: "Short lessons that get straight to the point. Easy to fit between classes.",
    approved: false,
  },
  {
    name: "Nisha",
    role: "Pilot tester",
    quote: "I liked asking the AI helper a doubt right in the middle of a lesson.",
    approved: false,
  },
  {
    name: "Nilay",
    role: "Pilot tester",
    quote: "Being able to resume exactly where I stopped made revision much easier.",
    approved: false,
  },
  {
    name: "Tanaya",
    role: "Pilot tester",
    quote: "The visuals stay in my head, so I remember topics far better after watching.",
    approved: false,
  },
];

// Live site: approved reviews only. Local dev: everything, so drafts can be previewed.
export const VISIBLE_TESTIMONIALS = TESTIMONIALS.filter((t) => t.approved || import.meta.env.DEV);

export default TESTIMONIALS;
