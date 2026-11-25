// The three exams Kanthast Professional is for. Only stable facts about each exam are stated here;
// dates, patterns, eligibility and syllabus change, so every page tells the reader to check the official notice.
// Anything Kanthast does or does not offer must match the homepage FAQ (data/faqs.js).
export const EXAMS = [
  {
    slug: "neet-pg",
    path: "/neet-pg",
    name: "NEET PG",
    long: "National Eligibility cum Entrance Test, Postgraduate",
    about:
      "NEET PG is the entrance exam for MD, MS and postgraduate diploma seats in medical colleges in India. It is conducted by the National Board of Examinations in Medical Sciences (NBEMS).",
    official: "the official NBEMS notice",
    faqs: [
      { q: "Can I prepare for NEET PG with Kanthast?", a: "You can use the Kanthast library to revise subject by subject once lectures are published. It is not a complete NEET PG course today: there is no question bank or mock tests yet." },
    ],
  },
  {
    slug: "ini-cet",
    path: "/ini-cet",
    name: "INI CET",
    long: "Institute of National Importance Combined Entrance Test",
    about:
      "INI CET is the combined entrance exam for postgraduate medical courses at AIIMS and other Institutes of National Importance. It is conducted by AIIMS, New Delhi.",
    official: "the official AIIMS notice",
    faqs: [
      { q: "Is Kanthast enough for INI CET?", a: "No single resource is, and Kanthast is not one yet. It offers animated lectures by subject and chapter, with notes and an images page, and does not yet include a question bank or mock tests." },
    ],
  },
  {
    slug: "usmle",
    path: "/usmle",
    name: "USMLE",
    long: "United States Medical Licensing Examination",
    about:
      "The USMLE is the multi-step licensing examination for doctors who want to practise in the United States. It is sponsored by the Federation of State Medical Boards (FSMB) and the National Board of Medical Examiners (NBME).",
    official: "the official USMLE website",
    faqs: [
      { q: "Does Kanthast follow the USMLE Steps?", a: "Not yet. The library is organised by subject and chapter, not by Step, so it does not mark which topics belong to Step 1 or Step 2 CK." },
    ],
  },
];

export const examBySlug = (slug) => EXAMS.find((exam) => exam.slug === slug);
