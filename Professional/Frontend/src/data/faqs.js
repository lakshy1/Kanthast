import { LESSONS_OPEN, PAYMENTS_OPEN } from "../config/launch";

// Every FAQ for Kanthast Professional. `home: true` ones also show on the homepage; /help shows all.
export const FAQS = [
  {
    q: "Are the lectures available to watch?",
    home: true,
    a: LESSONS_OPEN
      ? "Yes, the lectures that are published. Every planned lecture is listed, and each one opens the moment its video is published."
      : "Not yet. Lectures are coming soon. Every planned lecture is already listed, so you can see what is on the way, and each one opens the moment its video is published.",
  },
  {
    q: "Which exams is Kanthast for?",
    home: true,
    a: "NEET PG, INI CET and USMLE. The library is organised by subject and chapter, not by exam, so one lecture serves whichever exam you are preparing for. It does not yet mark which topics each exam weighs most; we will say so here when it does. Today it maps the five subjects shown on this page. NEET UG is coming soon.",
  },
  {
    q: "Is there a question bank or mock tests?",
    home: true,
    a: "Not yet. Today Kanthast Professional is animated lectures with written notes, an images page, progress tracking and the Kanthast Assistant. A question bank, previous year questions and mock tests are not included.",
  },
  {
    q: "How much does it cost?",
    home: true,
    a: PAYMENTS_OPEN
      ? "Rs 10,000 for one year, or Rs 18,000 for two years."
      : "Rs 10,000 for one year, or Rs 18,000 for two years. Payments are not open yet, and we will tell you before anything is charged. A free account works in the meantime.",
  },
  {
    q: "What can I open without paying?",
    a: "Once lectures are released, every lecture is free with an account until payments open. After that, the first two lectures in every section stay free and a plan unlocks the rest as they are released.",
  },
  {
    q: "Will it remember where I stopped?",
    a: "Yes. Leave a lecture halfway and your next visit resumes at the same second, at the playback speed you prefer.",
  },
  {
    q: "Is there more than the video?",
    a: "Yes. Lectures come with written notes and an images page, so you can revise a topic without rewatching it.",
  },
  {
    q: "How do I track my progress?",
    a: "Your dashboard keeps the lecture to resume on top and counts what you have watched, subject by subject.",
  },
  {
    q: "Can I ask questions while I study?",
    a: "Yes. Signed in students can ask the Kanthast Assistant about a topic or about using the platform.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. The whole site is built for phones, including the library, the player and resume.",
  },
  {
    q: "Can I get a refund?",
    home: true,
    a: "Refunds follow our Refund Policy, linked in the footer of every page. For anything it does not cover, contact us and we will help.",
  },
];

export const HOME_FAQS = FAQS.filter((item) => item.home);
