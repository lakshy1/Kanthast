import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import DemoVideoModal from "../components/DemoVideoModal";
import schoolHeroImage from "../assets/images/School-Hero-I.png";
import demoVideo from "../../resources/Kanthast-demo.mp4";
import {
  FaArrowRight,
  FaBarsProgress,
  FaBookOpen,
  FaChartLine,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaCirclePlay,
  FaMagnifyingGlassChart,
  FaRegCircleCheck,
  FaShieldHeart,
  FaStar,
} from "react-icons/fa6";

const schoolTokens = {
  bgPrimary: "#0B1120",
  bgSurface: "#111827",
  bgElevated: "#1A2438",
  bgBorder: "#1E2D45",
  accentAmber: "#F59E0B",
  accentOrange: "#F97316",
  accentGreen: "#10B981",
  accentYellow: "#FCD34D",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#4B5563",
};

const subjectStrip = [
  { emoji: "SCI", name: "Science" },
  { emoji: "MTH", name: "Mathematics" },
  { emoji: "SST", name: "Social Studies" },
  { emoji: "ENG", name: "English" },
  { emoji: "PHY", name: "Physics" },
  { emoji: "CHE", name: "Chemistry" },
  { emoji: "BIO", name: "Biology" },
  { emoji: "GEO", name: "Geometry" },
  { emoji: "HIS", name: "History" },
  { emoji: "LIF", name: "Life Science" },
];
const howItWorks = [
  {
    number: "01",
    icon: FaBookOpen,
    title: "Pick your subject",
    description:
      "Choose from Maths, Science, Social Studies and more. Aligned to your board and class.",
  },
  {
    number: "02",
    icon: FaCirclePlay,
    title: "Watch it come alive",
    description:
      "3D animations break down every concept so it clicks visually, not just on paper.",
  },
  {
    number: "03",
    icon: FaRegCircleCheck,
    title: "Test what you learned",
    description:
      "In-video questions and chapter quizzes that check real understanding, not rote recall.",
  },
  {
    number: "04",
    icon: FaChartLine,
    title: "Track your progress",
    description:
      "Earn XP, maintain streaks, and watch your confidence grow concept by concept.",
  },
];

const tabData = {
  Science: {
    label: "Science - 3D Lab",
    lessonTitle: "The Human Digestive System",
    subtext: "Immersive concept walkthrough with chapter checkpoints and quiz bursts.",
    previewStats: ["3D Animation", "12 Questions", "+150 XP"],
    chapters: [
      { title: "Light - Reflection & Refraction", classLevel: "Class 8" },
      { title: "The Human Eye", classLevel: "Class 10" },
      { title: "Photosynthesis", classLevel: "Class 7" },
      { title: "Atoms & Molecules", classLevel: "Class 9" },
      { title: "Electricity & Circuits", classLevel: "Class 10" },
    ],
    gradient: "from-[#172554] via-[#312E81] to-[#581C87]",
  },
  Mathematics: {
    label: "Mathematics - Problem Solving",
    lessonTitle: "Visual Geometry Proofs",
    subtext: "Build pattern-recognition first so formulas feel obvious instead of memorised.",
    previewStats: ["24 Practice Sets", "Skill Graph", "+110 XP"],
    chapters: [
      { title: "Linear Equations", classLevel: "Class 8" },
      { title: "Surface Areas & Volumes", classLevel: "Class 9" },
      { title: "Coordinate Geometry", classLevel: "Class 10" },
      { title: "Triangles & Similarity", classLevel: "Class 10" },
      { title: "Integers in Motion", classLevel: "Class 6" },
    ],
    gradient: "from-[#0F172A] via-[#1D4ED8] to-[#0EA5E9]",
  },
  "Social Studies": {
    label: "Social Studies - Story Maps",
    lessonTitle: "Monsoons, Maps and Civilisations",
    subtext: "Animated timelines and interactive maps make people, places and events easier to retain.",
    previewStats: ["Map Mode", "Story Cards", "+90 XP"],
    chapters: [
      { title: "The Water Cycle", classLevel: "Class 6" },
      { title: "Delhi Sultanate", classLevel: "Class 7" },
      { title: "Our Constitution", classLevel: "Class 8" },
      { title: "Resources & Development", classLevel: "Class 10" },
      { title: "Climate & Weather", classLevel: "Class 9" },
    ],
    gradient: "from-[#1E1B4B] via-[#166534] to-[#14532D]",
  },
  English: {
    label: "English - Language Lab",
    lessonTitle: "Grammar That Feels Natural",
    subtext: "Stories, visuals and usage examples make writing and comprehension more intuitive.",
    previewStats: ["Reading Lab", "Speaking Drills", "+80 XP"],
    chapters: [
      { title: "Tenses Made Simple", classLevel: "Class 7" },
      { title: "Figures of Speech", classLevel: "Class 8" },
      { title: "Reading Comprehension", classLevel: "Class 9" },
      { title: "Writing Better Answers", classLevel: "Class 10" },
      { title: "Vocabulary Builder", classLevel: "Class 6" },
    ],
    gradient: "from-[#3F1D2E] via-[#7C2D12] to-[#C2410C]",
  },
};
const painSolutions = [
  {
    pain: "My child watches videos but forgets everything by exam time.",
    solution:
      "3D animations plus in-video questions force active recall, not passive watching. Concepts stick because they are understood, not memorised.",
    visualTitle: "Memory shift",
    visualBullets: ["Text-only learning", "3D visual memory", "Quiz checkpoint recall"],
  },
  {
    pain: "Textbooks are confusing. My child just doesn't get it.",
    solution:
      "Visual-first learning shows every abstract concept in 3D before it is explained in words. See it, then read it.",
    visualTitle: "See -> understand",
    visualBullets: ["Concept snapshot", "Animated explanation", "Confidence unlock"],
  },
  {
    pain: "We spend on tuition but marks aren't improving.",
    solution:
      "Chapter mastery quizzes identify exact weak spots so your child practices what matters, not everything randomly.",
    visualTitle: "Target weak spots",
    visualBullets: ["Quiz diagnosis", "Weak-topic highlight", "Focused revision plan"],
  },
  {
    pain: "My child gets distracted on the phone.",
    solution:
      "Streaks, XP, and challenges make studying feel like a game. One more lesson always feels worth it.",
    visualTitle: "Make learning rewarding",
    visualBullets: ["7-day streak", "+150 XP", "Badge earned today"],
  },
];
const stats = [
  { icon: "STU", value: "50,000+", label: "Students learning" },
  { icon: "3D", value: "500+", label: "3D animated lessons" },
  { icon: "BRD", value: "20+", label: "Boards covered" },
  { icon: "TOP", value: "4.8/5", label: "Average rating" },
];
const testimonials = [
  {
    quote:
      "Science used to be my worst subject. Now I actually look forward to it. The 3D models make everything so clear.",
    author: "Arjun, Class 9, Delhi",
  },
  {
    quote:
      "My daughter went from 62% to 84% in her Science boards. Kanthast made the difference.",
    author: "Parent, Bengaluru",
  },
  {
    quote:
      "The streak system kept me going even during holidays. Never missed a day in 3 weeks!",
    author: "Priya, Class 8, Chennai",
  },
  {
    quote:
      "Finally a platform that explains WHY, not just what. My son loves it.",
    author: "Parent, Pune",
  },
  {
    quote:
      "I understood the water cycle in one animation. My teacher had been explaining it for a week.",
    author: "Rahul, Class 7, Hyderabad",
  },
  {
    quote:
      "The quiz feedback is incredible. It tells you exactly which part of the chapter you missed.",
    author: "Sneha, Class 10, Jaipur",
  },
  {
    quote:
      "Worth every rupee. My child is self-studying now without me sitting next to her.",
    author: "Parent, Mumbai",
  },
  {
    quote:
      "I scored 95 in Maths this term. Kanthast's geometry animations were everything.",
    author: "Aditya, Class 10, Lucknow",
  },
];

const parentFeatures = [
  {
    icon: FaBarsProgress,
    title: "Weekly Progress Reports",
    description:
      "Get a detailed summary every Sunday: what your child studied, how they scored, and what needs attention.",
  },
  {
    icon: FaMagnifyingGlassChart,
    title: "Parent Dashboard",
    description:
      "See chapter completion, quiz scores, time spent, and streak history at a glance. Always know where your child stands.",
  },
  {
    icon: FaShieldHeart,
    title: "No distractions by design",
    description:
      "No social feed, no ads, no recommended videos. Every minute on the app is a learning minute.",
  },
];

const pricingFeatures = {
  free: [
    "10 free animated lessons",
    "2 subjects",
    "Basic quizzes",
    "Progress tracking",
  ],
  annual: [
    "All subjects",
    "All classes (I-X)",
    "Unlimited 3D lessons",
    "Quizzes & assessments",
    "Weekly parent reports",
    "AI doubt solving 24/7",
    "Offline downloads",
  ],
};
const comparisonRows = [
  ["No. of subjects", "2", "All"],
  ["Animated lessons", "10", "Unlimited"],
  ["Quizzes", "Basic", "Full mastery suite"],
  ["Parent reports", "-", "Weekly"],
  ["AI doubt solving", "-", "Included"],
];
const faqItems = [
  {
    question: "Which boards does Kanthast School support?",
    answer:
      "CBSE, ICSE, and 20+ state boards including Maharashtra, Karnataka, Tamil Nadu, Rajasthan, UP and MP boards.",
  },
  {
    question: "Is this suitable for all classes from I to X?",
    answer:
      "Yes. Content is available for all classes and each lesson is tagged by class and chapter so your child sees only what is relevant.",
  },
  {
    question: "How is this different from YouTube or free videos?",
    answer:
      "Kanthast School keeps learning active with in-video questions, mastery quizzes, and XP systems instead of passive watching.",
  },
  {
    question: "Does my child need a laptop or will a phone work?",
    answer:
      "The experience works well on Android and iOS smartphones, so a laptop is optional rather than required.",
  },
  {
    question: "What subjects are covered?",
    answer:
      "Maths, Science, Social Studies, and English are the core focus, with more subjects being added over time.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. There is a 7-day free trial with no credit card needed, including access to 10 animated lessons across 2 subjects.",
  },
  {
    question: "What happens to progress after the trial ends?",
    answer:
      "Progress is saved, so if you upgrade later your child continues right from where they left off.",
  },
];

function SectionLabel({ children }) {
  return (
    <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
      {children}
    </span>
  );
}

function PrimaryButton({ children }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-500"
    >
      {children}
    </button>
  );
}

function GhostButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-50 transition hover:border-amber-300 hover:text-amber-300"
      {...props}
    >
      {children}
    </button>
  );
}

function LessonPreviewCard({ label, title, subtext, statsList, gradient, compact = false }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-[28px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(26,36,56,0.98),rgba(17,24,39,0.98))] p-5 shadow-[0_30px_70px_rgba(2,6,23,0.45)] ${compact ? "max-w-md" : ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_32%)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-400/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            {label}
          </span>
          <span className="text-xs text-slate-400">Preview lesson</span>
        </div>

        <div className={`relative h-56 overflow-hidden rounded-[22px] bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_24%),linear-gradient(180deg,rgba(11,17,32,0.05),rgba(11,17,32,0.6))]" />
          <div className="absolute inset-x-6 top-6 h-12 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm" />
          <div className="absolute left-6 top-24 h-24 w-24 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm" />
          <div className="absolute right-8 top-24 h-3 w-32 rounded-full bg-white/25" />
          <div className="absolute right-8 top-32 h-3 w-24 rounded-full bg-white/20" />
          <div className="absolute right-8 top-40 h-3 w-20 rounded-full bg-white/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/14 shadow-[0_0_60px_rgba(245,158,11,0.35)] backdrop-blur-md">
              <FaCirclePlay className="text-3xl text-white" />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-xl font-black text-slate-50">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">{subtext}</p>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Progress</span>
            <span className="text-amber-300">62%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800">
            <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_18px_rgba(245,158,11,0.45)]" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statsList.map((stat) => (
            <span
              key={stat}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              {stat}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SchoolHomepage() {
  const [activeTab, setActiveTab] = useState("Science");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activePainIndex, setActivePainIndex] = useState(0);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const activeTabContent = tabData[activeTab];

  const marqueeTestimonials = useMemo(
    () => [...testimonials, ...testimonials],
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePainIndex((current) => (current + 1) % painSolutions.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const goToPainSlide = (index) => {
    setActivePainIndex(index);
  };

  const showPreviousPainSlide = () => {
    setActivePainIndex((current) => (current - 1 + painSolutions.length) % painSolutions.length);
  };

  const showNextPainSlide = () => {
    setActivePainIndex((current) => (current + 1) % painSolutions.length);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B1120] text-slate-50">
      <Helmet>
        <title>Kanthast School | Learning that actually sticks</title>
        <meta
          name="description"
          content="Kanthast School brings Maths, Science, Social Studies and more alive through immersive 3D animations for Class I to Class X students."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{`
        .school-page {
          --bg-primary: #0B1120;
          --bg-surface: #111827;
          --bg-elevated: #1A2438;
          --bg-border: #1E2D45;
          --accent-amber: #F59E0B;
          --accent-orange: #F97316;
          --accent-green: #10B981;
          --accent-yellow: #FCD34D;
          --text-primary: #F8FAFC;
          --text-secondary: #94A3B8;
          --text-muted: #4B5563;
          font-family: 'Inter', sans-serif;
          background:
            radial-gradient(circle at 78% 18%, rgba(245,158,11,0.11), transparent 24%),
            radial-gradient(circle at 14% 24%, rgba(16,185,129,0.08), transparent 26%),
            linear-gradient(180deg, rgba(11,17,32,1), rgba(11,17,32,1));
        }
        .school-display {
          font-family: 'Nunito', sans-serif;
        }
        .hero-dot-grid {
          background-image:
            radial-gradient(rgba(248,250,252,0.09) 0.8px, transparent 0.8px);
          background-size: 22px 22px;
        }
        .subject-marquee {
          animation: school-marquee 24s linear infinite;
        }
        .testimonial-marquee {
          animation: school-marquee 34s linear infinite;
        }
        .subject-marquee:hover,
        .testimonial-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes school-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .subject-marquee,
          .testimonial-marquee {
            animation: none !important;
          }
        }
      `}</style>

      <div className="school-page">
        <section className="hero-dot-grid relative overflow-hidden border-b border-slate-800/70 pt-6 md:pt-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(245,158,11,0.08)_0%,transparent_60%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-16 pt-10 md:px-10 md:pb-20 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-16 lg:pb-24 lg:pt-14">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                * Class I - X - CBSE & State Boards
              </span>
              <h1 className="school-display mt-6 text-5xl font-black leading-[0.95] text-slate-50 md:text-6xl lg:text-7xl">
                Learning that
                <span className="block">actually sticks.</span>
              </h1>
              <p className="school-display mt-5 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl lg:text-[2.65rem]">
                Watch. Understand. Score.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Kanthast School brings Maths, Science, Social Studies and more alive through
                immersive 3D animations so your child does not just memorise, they truly understand.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <PrimaryButton>
                  Start Learning Free <FaArrowRight />
                </PrimaryButton>
                <GhostButton onClick={() => setShowDemoVideo(true)}>
                  Watch Demo <FaCirclePlay />
                </GhostButton>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
                {[
                  "No credit card",
                  "Free for 7 days",
                  "CBSE & 20+ State Boards",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <FaCheck className="text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="relative z-10 mx-auto w-full max-w-[34rem] lg:max-w-[36rem]"
            >
              <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle,rgba(245,158,11,0.18),transparent_55%)] blur-3xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-amber-300/20 shadow-[0_30px_70px_rgba(2,6,23,0.45)]">
                <img
                  src={schoolHeroImage}
                  alt="Kanthast School lesson preview"
                  className="block w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="subjects" className="border-b border-slate-800/70 py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Subjects covered
            </p>
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0B1120] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0B1120] to-transparent" />
              <div className="subject-marquee flex w-max gap-3 pr-3">
                {[...subjectStrip, ...subjectStrip].map((subject, index) => (
                  <div
                    key={`${subject.name}-${index}`}
                    className="flex items-center gap-2 rounded-full border border-[#1E2D45] bg-[#111827] px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-amber-400/50"
                  >
                    <span>{subject.emoji}</span>
                    <span>{subject.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-16">
          <div className="max-w-3xl">
            <SectionLabel>How Kanthast School works</SectionLabel>
            <h2 className="school-display mt-5 w-full text-4xl font-black leading-tight text-slate-50 md:text-5xl">
              From confused to confident - in 4 steps
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="relative rounded-[24px] border border-[#1E2D45] bg-[#111827] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.25)]"
                >
                  <span className="school-display text-5xl font-black text-amber-400/30">
                    {step.number}
                  </span>
                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/14 text-amber-300">
                    <Icon />
                  </div>
                  <h3 className="school-display mt-5 text-xl font-extrabold text-slate-50">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
                  {index < howItWorks.length - 1 && (
                    <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 xl:block">
                      <FaArrowRight className="text-xl text-amber-400/40" />
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-800/70 bg-[linear-gradient(180deg,rgba(17,24,39,0.55),rgba(11,17,32,0.92))] py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
            <div className="max-w-3xl">
              <SectionLabel>Interactive subject deep dive</SectionLabel>
              <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-5xl">
                Every subject. Every concept. Fully animated.
              </h2>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {Object.keys(tabData).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "border-amber-300/50 bg-amber-400/14 text-amber-200"
                      : "border-[#1E2D45] bg-[#111827] text-slate-300 hover:border-amber-300/30 hover:text-slate-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.08fr]">
              <div className="space-y-4">
                {activeTabContent.chapters.map((chapter, index) => (
                  <motion.article
                    key={chapter.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.05 }}
                    className="rounded-[22px] border border-[#1E2D45] bg-[#111827] p-5 transition hover:border-amber-400/35"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="school-display text-xl font-extrabold text-slate-50">
                          {chapter.title}
                        </h3>
                        <span className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                          {chapter.classLevel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDemoVideo(true)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
                      >
                        Watch Demo <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>

              <LessonPreviewCard
                label={activeTabContent.label}
                title={activeTabContent.lessonTitle}
                subtext={activeTabContent.subtext}
                statsList={activeTabContent.previewStats}
                gradient={activeTabContent.gradient}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-16">
          <div className="w-full">
            <SectionLabel>Sound familiar?</SectionLabel>
            <h2 className="school-display mt-5 w-full text-4xl font-black leading-tight text-slate-50 md:text-5xl">
              The pain points parents keep describing - solved visually
            </h2>
          </div>

          <div className="mt-12">
            <motion.div
              key={activePainIndex}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`grid gap-6 rounded-[30px] border border-[#1E2D45] bg-[#111827] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] lg:grid-cols-2 lg:p-8 ${
                activePainIndex % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-300">
                  Pain point
                </p>
                <h3 className="school-display mt-4 text-3xl font-black leading-tight text-slate-50">
                  "{painSolutions[activePainIndex].pain}"
                </h3>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Kanthast solution
                </p>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  {painSolutions[activePainIndex].solution}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#1A2438] p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%)]" />
                <div className="relative z-10">
                  <div className="mb-5 inline-flex rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                    {painSolutions[activePainIndex].visualTitle}
                  </div>
                  <div className="grid gap-3">
                    {painSolutions[activePainIndex].visualBullets.map((bullet, bulletIndex) => (
                      <div
                        key={bullet}
                        className={`rounded-2xl border px-4 py-4 text-sm font-medium ${
                          bulletIndex === 1
                            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                            : "border-white/10 bg-white/5 text-slate-200"
                        }`}
                      >
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={showPreviousPainSlide}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
                  aria-label="Show previous pain point"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={showNextPainSlide}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
                  aria-label="Show next pain point"
                >
                  <FaChevronRight />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {painSolutions.map((item, index) => (
                  <button
                    key={item.pain}
                    type="button"
                    onClick={() => goToPainSlide(index)}
                    className="group inline-flex items-center gap-2"
                    aria-label={`Go to pain point slide ${index + 1}`}
                    aria-pressed={activePainIndex === index}
                  >
                    <span
                      className={`h-2.5 rounded-full transition-all ${
                        activePainIndex === index
                          ? "w-10 bg-amber-400"
                          : "w-2.5 bg-slate-600 group-hover:bg-slate-500"
                      }`}
                    />
                    <span className="hidden text-xs font-medium text-slate-400 md:inline">
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800/70 bg-[#111827] py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 md:px-10 lg:grid-cols-4 lg:px-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl">{stat.icon}</p>
                <p className="school-display mt-3 text-4xl font-black text-amber-300">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
            <div className="max-w-3xl">
              <SectionLabel>What students & parents say</SectionLabel>
              <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-5xl">
                Loved by learners, trusted by parents
              </h2>
            </div>

            <div className="relative mt-10 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0B1120] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0B1120] to-transparent" />
              <div className="testimonial-marquee flex w-max gap-4 pr-4">
                {marqueeTestimonials.map((testimonial, index) => (
                  <article
                    key={`${testimonial.author}-${index}`}
                    className="w-[320px] shrink-0 rounded-[24px] border border-[#1E2D45] border-l-4 border-l-amber-400 bg-[#1A2438] p-5"
                  >
                    <div className="mb-4 flex gap-1 text-amber-300">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <FaStar key={starIndex} />
                      ))}
                    </div>
                    <p className="text-sm leading-7 text-slate-100">{testimonial.quote}</p>
                    <p className="mt-4 text-sm font-medium text-slate-400">{testimonial.author}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-slate-800/70 bg-[linear-gradient(180deg,rgba(17,24,39,0.8),rgba(11,17,32,1))] py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
            <div className="max-w-3xl">
              <SectionLabel>Simple pricing</SectionLabel>
              <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-5xl">
                Everything your child needs. One simple price.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#1E2D45] bg-[#111827] p-7">
                <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Start Here
                </span>
                <div className="mt-6 flex items-end gap-3">
                  <span className="school-display text-5xl font-black text-slate-50">Rs 0</span>
                  <span className="pb-2 text-slate-400">for 7 days</span>
                </div>
                <div className="mt-6 space-y-3">
                  {pricingFeatures.free.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                      <FaCheck className="text-emerald-400" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <GhostButton>
                    Start Free Trial <FaArrowRight />
                  </GhostButton>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-amber-300/30 bg-[#1A2438] p-7 shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_20px_60px_rgba(245,158,11,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
                <div className="relative z-10">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
                    Most Popular
                  </span>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="school-display text-5xl font-black text-slate-50">Rs 5,000/year</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-slate-500 line-through">Rs 5,999</span>
                    <span className="font-semibold text-amber-200">Just Rs 8/day</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    {pricingFeatures.annual.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                        <FaCheck className="text-emerald-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <PrimaryButton>
                      Get Full Access <FaArrowRight />
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[24px] border border-[#1E2D45] bg-[#111827]">
              <div className="grid grid-cols-3 border-b border-[#1E2D45] bg-white/5 px-5 py-4 text-sm font-semibold text-slate-300">
                <span>Feature</span>
                <span>Free</span>
                <span>Annual</span>
              </div>
              {comparisonRows.map(([feature, free, annual]) => (
                <div
                  key={feature}
                  className="grid grid-cols-3 border-b border-[#1E2D45] px-5 py-4 text-sm text-slate-300 last:border-b-0"
                >
                  <span className="font-medium text-slate-100">{feature}</span>
                  <span>{free}</span>
                  <span>{annual}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="parents" className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-16">
          <div className="max-w-3xl">
            <SectionLabel>For parents</SectionLabel>
            <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-5xl">
              Built for students. Designed for parents' peace of mind.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {parentFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-[24px] border border-[#1E2D45] bg-[#111827] p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/14 text-amber-300">
                    <Icon />
                  </div>
                  <h3 className="school-display mt-5 text-2xl font-extrabold text-slate-50">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-800/70 bg-[#111827] py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-10">
            <div className="text-center">
              <SectionLabel>Questions parents ask</SectionLabel>
              <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-5xl">
                Clear answers before you commit
              </h2>
            </div>

            <div className="mt-12 space-y-4">
              {faqItems.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-[22px] border bg-[#0F172A] transition ${
                      isOpen ? "border-amber-400/40" : "border-[#1E2D45]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                    >
                      <span className="school-display text-xl font-extrabold text-slate-50">
                        {faq.question}
                      </span>
                      <FaChevronDown
                        className={`shrink-0 text-amber-300 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#1E2D45] px-5 py-5 text-sm leading-7 text-slate-400">
                        {faq.answer}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16),transparent_34%)]" />
          <div className="mx-auto max-w-5xl px-6 text-center md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <SectionLabel>Start now</SectionLabel>
              <h2 className="school-display mt-5 text-4xl font-black leading-tight text-slate-50 md:text-6xl">
                Your child's best school year starts here.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Join 50,000+ students already learning with Kanthast School.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <PrimaryButton>
                  Start Free for 7 Days <FaArrowRight />
                </PrimaryButton>
                <GhostButton>Talk to Us</GhostButton>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-slate-300">
                {["No credit card", "Cancel anytime", "CBSE & State Boards"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <FaCheck className="text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <DemoVideoModal
          open={showDemoVideo}
          onClose={() => setShowDemoVideo(false)}
          src={demoVideo}
          ariaLabel="Kanthast School demo video"
        />
      </div>
    </div>
  );
}
