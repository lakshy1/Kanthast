import React, { useEffect, useRef, useState } from "react";
import { motion as Motion, useReducedMotion, useTransform } from "framer-motion";
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaExpand,
  FaGear,
  FaLock,
  FaMagnifyingGlass,
  FaPause,
  FaPlay,
  FaRegFileLines,
  FaRegImage,
  FaVolumeHigh,
} from "react-icons/fa6";
import SYLLABUS_SNAPSHOT from "../../data/syllabusSnapshot";

// A scroll-scrubbed walk through the app, drawn at the MacBook glass's exact
// aspect (1160 × 735) and scaled to fill it. Every value is derived from one
// 0–1 scroll progress, so scrolling down plays it forward and scrolling up
// rewinds it; nothing runs on a timer. Names and durations are real catalog
// entries; watch counts and progress are a sample signed-in state.

const W = 1160;
const H = 735;

const C = {
  bg: "#070F1C",
  panel: "#0C1627",
  raised: "#111D30",
  line: "#1B2A40",
  text: "#E3E9F1",
  muted: "#93A3B8",
  dim: "#5F7089",
  mint: "#6BECC9",
  mintSoft: "rgba(107,236,201,0.12)",
  lock: "#F08A24",
};

const { tourPreview, subjects: SUBJECTS } = SYLLABUS_SNAPSHOT;
const LECTURES = tourPreview.lectures;
const PHARM_CHAPTERS = tourPreview.chapters;
const BIOCHEM_CHAPTERS = SUBJECTS[0].sampleChapters;
const TABS = [
  { name: "Biochemistry", x: 28, w: 146 },
  { name: "Immunology", x: 186, w: 136 },
  { name: "Pharmacology", x: 334, w: 148 },
  { name: "Microbiology", x: 494, w: 142 },
  { name: "Neuroanatomy", x: 648, w: 150 },
];
const ACTIVE_LECTURE = 2; // Ezetimibe
const DURATION_S = 9 * 60 + 56;
const SPEEDS = [
  { label: "1×", x: 456 },
  { label: "1.25×", x: 502 },
  { label: "1.5×", x: 566 },
  { label: "2×", x: 612 },
];
const WATCHED = [62, 31, 58, 24, 40];
const LECTURE_POINTS = [
  "Blocks cholesterol absorption in the small intestine (NPC1L1)",
  "Lowers LDL cholesterol",
  "Often combined with a statin",
];

// Click moments in the storyboard, for the cursor's ripple.
const CLICKS = [0.05, 0.14, 0.3, 0.51];

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function useRange(p, input, output, options) {
  return useTransform(p, input, output, options);
}

function AppBar() {
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center px-[28px]"
      style={{ height: 64, borderBottom: `1px solid ${C.line}` }}
    >
      <span className="font-sans text-[21px] font-extrabold tracking-[-0.03em] text-white">Kanthast</span>
      <span className="ml-[10px] flex items-center gap-[5px] text-[12px] font-medium" style={{ color: "#69ACE9" }}>
        Medical <FaChevronDown className="text-[9px]" />
      </span>
      <span className="mx-auto flex items-center gap-[28px] pl-[70px] text-[13.5px]" style={{ color: "#C9D3E0" }}>
        <span>Home</span>
        <span className="flex items-center gap-[5px]">
          Courses <FaChevronDown className="text-[9px]" />
        </span>
        <span>Library</span>
        <span>Pricing</span>
        <span>About</span>
        <span>Contact</span>
      </span>
      <FaMagnifyingGlass className="mr-[28px] text-[15px]" style={{ color: "#C9D3E0" }} />
      <span className="grid h-[36px] w-[36px] place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: "#4A7FD9" }}>
        A
      </span>
    </div>
  );
}

function ActionDot({ icon: Icon, locked, highlight }) {
  return (
    <span
      className="relative grid h-[36px] w-[36px] place-items-center rounded-full"
      style={{ border: `1px solid ${highlight ? C.mint : C.line}`, color: highlight ? C.mint : C.muted }}
    >
      <Icon className="text-[12px]" />
      {locked ? (
        <span className="absolute -bottom-[2px] -right-[2px] grid h-[15px] w-[15px] place-items-center rounded-full text-white" style={{ background: C.lock }}>
          <FaLock className="text-[7px]" />
        </span>
      ) : null}
    </span>
  );
}

function LectureRow({ p, lecture, index }) {
  const start = 0.16 + index * 0.015;
  const opacity = useRange(p, [start, start + 0.04], [0, 1]);
  const y = useRange(p, [start, start + 0.04], [14, 0]);
  const hover = useRange(p, [0.25, 0.28], [0, 1]);
  const isActive = index === ACTIVE_LECTURE;
  return (
    <Motion.li
      className="relative flex h-[80px] items-center px-[24px]"
      style={{ opacity, y, borderBottom: index < LECTURES.length - 1 ? `1px solid ${C.line}` : "none" }}
    >
      {isActive ? (
        <Motion.span
          className="absolute inset-x-[10px] inset-y-[6px] rounded-[10px]"
          style={{ opacity: hover, background: C.mintSoft }}
        />
      ) : null}
      <span className="relative min-w-0 flex-1">
        <span className="block text-[17px] font-semibold" style={{ color: C.text }}>{lecture.name}</span>
        <span className="mt-[3px] block text-[13px] tabular-nums" style={{ color: C.muted }}>{lecture.duration}</span>
      </span>
      <span className="relative flex gap-[8px]">
        <ActionDot icon={FaRegFileLines} />
        <ActionDot icon={FaPlay} locked={index >= 2} highlight={isActive} />
        <ActionDot icon={FaRegImage} locked={index >= 2} />
      </span>
    </Motion.li>
  );
}

function LibraryScene({ p }) {
  const opacity = useRange(p, [0.32, 0.37], [1, 0]);
  const scale = useRange(p, [0.32, 0.37], [1, 0.97]);
  const tabX = useRange(p, [0.035, 0.06], [TABS[0].x, TABS[2].x]);
  const tabW = useRange(p, [0.035, 0.06], [TABS[0].w, TABS[2].w]);
  const biochemInk = useRange(p, [0.035, 0.06], ["#FFFFFF", C.muted]);
  const pharmInk = useRange(p, [0.035, 0.06], [C.muted, "#FFFFFF"]);
  const biochemList = useRange(p, [0.05, 0.08], [1, 0]);
  const pharmList = useRange(p, [0.05, 0.08], [0, 1]);
  const jumpOpacity = useRange(p, [0.07, 0.09], [0, 1]);
  const jumpY = useRange(p, [0.09, 0.135], [0, 3 * 46]);
  const lipidInk = useRange(p, [0.13, 0.14], [C.muted, C.mint]);
  const skeleton = useRange(p, [0.14, 0.17], [1, 0]);
  const header = useRange(p, [0.15, 0.18], [0, 1]);

  return (
    <Motion.div className="absolute inset-0" style={{ opacity, scale }}>
      <div className="absolute" style={{ left: 0, top: 84, width: W, height: 40 }}>
        <Motion.span
          className="absolute top-0 h-[40px] rounded-[10px]"
          style={{ x: tabX, width: tabW, background: C.raised, border: `1px solid ${C.mint}55` }}
        />
        {TABS.map((tab, i) => (
          <Motion.span
            key={tab.name}
            className="absolute top-0 grid h-[40px] place-items-center rounded-[10px] text-[14px] font-semibold"
            style={{
              left: tab.x,
              width: tab.w,
              border: `1px solid ${C.line}`,
              color: i === 0 ? biochemInk : i === 2 ? pharmInk : C.muted,
            }}
          >
            {tab.name}
          </Motion.span>
        ))}
      </div>

      <div className="absolute rounded-[16px]" style={{ left: 28, top: 146, width: 620, height: 561, background: C.panel, border: `1px solid ${C.line}` }}>
        <Motion.div className="absolute inset-0 p-[24px]" style={{ opacity: skeleton }}>
          <div className="h-[18px] w-[200px] rounded-full" style={{ background: C.raised }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mt-[34px] flex items-center justify-between">
              <div>
                <div className="h-[14px] rounded-full" style={{ width: 180 + ((i * 47) % 90), background: C.raised }} />
                <div className="mt-[10px] h-[10px] w-[60px] rounded-full" style={{ background: C.raised }} />
              </div>
              <div className="h-[36px] w-[124px] rounded-full" style={{ background: C.raised }} />
            </div>
          ))}
        </Motion.div>
        <Motion.p className="absolute left-[24px] top-[22px] text-[19px] font-bold" style={{ opacity: header, color: C.text }}>
          {tourPreview.chapter}
        </Motion.p>
        <ul className="absolute inset-x-0 top-[70px]">
          {LECTURES.map((lecture, index) => (
            <LectureRow key={lecture.name} p={p} lecture={lecture} index={index} />
          ))}
        </ul>
      </div>

      <div className="absolute overflow-hidden rounded-[16px]" style={{ left: 668, top: 146, width: 464, height: 561, background: C.panel, border: `1px solid ${C.line}` }}>
        <p className="absolute left-[24px] top-[22px] text-[16px] font-bold" style={{ color: C.text }}>Jump to:</p>
        <Motion.span
          className="absolute left-[14px] right-[14px] top-[64px] h-[46px] rounded-[10px]"
          style={{ opacity: jumpOpacity, y: jumpY, background: C.mintSoft }}
        />
        <Motion.ul className="absolute inset-x-0 top-[64px]" style={{ opacity: biochemList }}>
          {BIOCHEM_CHAPTERS.map((name) => (
            <li key={name} className="flex h-[46px] items-center justify-between px-[28px] text-[14.5px]" style={{ color: C.muted }}>
              {name} <FaChevronRight className="text-[10px]" />
            </li>
          ))}
        </Motion.ul>
        <Motion.ul className="absolute inset-x-0 top-[64px]" style={{ opacity: pharmList }}>
          {PHARM_CHAPTERS.map((name, i) => (
            <Motion.li
              key={name}
              className="relative flex h-[46px] items-center justify-between px-[28px] text-[14.5px]"
              style={{ color: i === 3 ? lipidInk : C.muted }}
            >
              <span className="truncate">{name}</span> <FaChevronRight className="shrink-0 text-[10px]" />
            </Motion.li>
          ))}
        </Motion.ul>
      </div>
    </Motion.div>
  );
}

function PlayerScene({ p }) {
  const opacity = useRange(p, [0.33, 0.38, 0.68, 0.73], [0, 1, 1, 0]);
  const scale = useRange(p, [0.33, 0.38], [1.03, 1]);
  const fill = useRange(p, [0.4, 0.66], [32.2, 88]);
  const fillWidth = useTransform(fill, (v) => `${v}%`);
  const time = useTransform(fill, (v) => `${fmt((DURATION_S * v) / 100)} / ${fmt(DURATION_S)}`);
  const resumed = useRange(p, [0.38, 0.4, 0.47, 0.5], [0, 1, 1, 0]);
  const speedX = useRange(p, [0.505, 0.53], [SPEEDS[0].x, SPEEDS[1].x]);
  const speedW = useRange(p, [0.505, 0.53], [40, 58]);
  const point0 = useRange(p, [0.44, 0.47], [0, 1]);
  const point1 = useRange(p, [0.52, 0.55], [0, 1]);
  const point2 = useRange(p, [0.6, 0.63], [0, 1]);
  const points = [point0, point1, point2];
  const glowX = useRange(p, [0.38, 0.7], ["20%", "80%"]);
  const glow = useTransform(glowX, (x) => `radial-gradient(60% 70% at ${x} 30%, rgba(74,127,217,0.35), transparent 70%)`);
  const speed0Ink = useRange(p, [0.505, 0.53], ["#06111F", C.muted]);
  const speed1Ink = useRange(p, [0.505, 0.53], [C.muted, "#06111F"]);
  const lecture = LECTURES[ACTIVE_LECTURE];

  return (
    <Motion.div className="absolute inset-0" style={{ opacity, scale }}>
      <p className="absolute flex items-center gap-[8px] text-[13px]" style={{ left: 28, top: 84, color: C.muted }}>
        {tourPreview.subject} <FaChevronRight className="text-[8px]" /> {tourPreview.chapter}
        <FaChevronRight className="text-[8px]" /> {lecture.name}
      </p>
      <div className="absolute flex items-center gap-[14px]" style={{ left: 28, top: 108 }}>
        <span className="grid h-[34px] w-[34px] place-items-center rounded-full border-2 border-white">
          <FaPlay className="ml-[2px] text-[12px] text-white" />
        </span>
        <span className="font-sans text-[26px] font-bold tracking-[-0.02em] text-white">{lecture.name}</span>
      </div>

      <div className="absolute overflow-hidden rounded-[12px]" style={{ left: 28, top: 156, width: 740, height: 416, background: "#0F1D42" }}>
        <Motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: glow,
          }}
        />
        <div className="absolute left-[40px] top-[40px] right-[40px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#8FB4F5" }}>
            {tourPreview.subject} · {tourPreview.chapter}
          </p>
          <p className="mt-[10px] font-sans text-[44px] font-extrabold tracking-[-0.03em] text-white">{lecture.name}</p>
          <ul className="mt-[26px] space-y-[16px]">
            {LECTURE_POINTS.map((point, i) => (
              <Motion.li key={point} className="flex items-start gap-[14px] text-[19px] text-[#DCE6F2]" style={{ opacity: points[i] }}>
                <span className="mt-[9px] h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: C.mint }} />
                {point}
              </Motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute h-[5px] rounded-full" style={{ left: 28, top: 592, width: 740, background: "#2A3446" }}>
        <Motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ width: fillWidth, background: C.mint }} />
        <Motion.span
          className="absolute top-1/2 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: fillWidth, background: C.mint }}
        />
      </div>

      <div className="absolute flex items-center gap-[20px] text-[17px]" style={{ left: 28, top: 612, height: 28, color: "#D5DDE8" }}>
        <FaPause />
        <FaVolumeHigh />
        <Motion.span className="text-[14px] tabular-nums">{time}</Motion.span>
      </div>
      <div className="absolute" style={{ left: 0, top: 612, height: 28 }}>
        <Motion.span className="absolute top-0 h-[28px] rounded-full" style={{ x: speedX, width: speedW, background: C.mint }} />
        {SPEEDS.map((speed, i) => (
          <Motion.span
            key={speed.label}
            className="absolute top-0 grid h-[28px] place-items-center text-[13px] font-semibold"
            style={{
              left: speed.x,
              width: i === 1 ? 58 : 40,
              color: i === 0 ? speed0Ink : i === 1 ? speed1Ink : C.muted,
            }}
          >
            {speed.label}
          </Motion.span>
        ))}
      </div>
      <div className="absolute flex h-[28px] items-center gap-[22px] text-[16px]" style={{ left: 704, top: 612, color: "#D5DDE8" }}>
        <FaGear />
        <FaExpand />
      </div>
      <Motion.span
        className="absolute rounded-full px-[14px] py-[7px] text-[13px] font-semibold"
        style={{ left: 28, top: 656, opacity: resumed, background: C.mintSoft, color: C.mint }}
      >
        Resumed from 3:12 · Start from beginning
      </Motion.span>

      <div className="absolute rounded-[16px]" style={{ left: 792, top: 84, width: 340, height: 623, background: C.panel, border: `1px solid ${C.line}` }}>
        <p className="px-[22px] pt-[20px] text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          Up next in this chapter
        </p>
        <ul className="mt-[12px] space-y-[4px] px-[10px]">
          {LECTURES.map((item, i) => {
            const current = i === ACTIVE_LECTURE;
            return (
              <li
                key={item.name}
                className="flex h-[64px] items-center gap-[14px] rounded-[10px] px-[12px]"
                style={{ background: current ? "#152238" : "transparent" }}
              >
                <span
                  className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full"
                  style={
                    current
                      ? { background: C.mint, color: "#07111F" }
                      : i < ACTIVE_LECTURE
                        ? { background: C.mintSoft, color: C.mint }
                        : { border: `1.5px solid ${C.dim}`, color: C.muted }
                  }
                >
                  {i < ACTIVE_LECTURE ? <FaCheck className="text-[11px]" /> : <FaPlay className="ml-[2px] text-[10px]" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium" style={{ color: C.text }}>{item.name}</span>
                  <span className="mt-[2px] block text-[12.5px] tabular-nums" style={{ color: current ? C.mint : C.muted }}>
                    {i < ACTIVE_LECTURE ? "Watched" : item.duration}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Motion.div>
  );
}

function Counter({ p, input, to }) {
  const value = useRange(p, input, [0, to]);
  const text = useTransform(value, (v) => Math.round(v).toLocaleString("en-IN"));
  return <Motion.span className="tabular-nums">{text}</Motion.span>;
}

function SubjectRow({ p, subject, watched, index }) {
  const start = 0.78 + index * 0.02;
  const pct = Math.round((watched / subject.lectures) * 100);
  const width = useRange(p, [start, start + 0.14], ["0%", `${pct}%`]);
  const percent = useTransform(useRange(p, [start, start + 0.14], [0, pct]), (v) => `${Math.round(v)}%`);
  return (
    <li className="flex h-[58px] items-center gap-[24px] px-[24px]" style={{ borderTop: index ? `1px solid ${C.line}` : "none" }}>
      <span className="w-[170px] text-[16px] font-semibold" style={{ color: C.text }}>{subject.name}</span>
      <span className="w-[150px] text-[13px]" style={{ color: C.muted }}>
        <Counter p={p} input={[start, start + 0.14]} to={watched} /> / {subject.lectures} watched
      </span>
      <span className="relative h-[8px] flex-1 rounded-full" style={{ background: "#1E2A3C" }}>
        <Motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ width, background: C.mint }} />
      </span>
      <Motion.span className="w-[48px] text-right text-[15px] font-bold tabular-nums" style={{ color: C.text }}>
        {percent}
      </Motion.span>
    </li>
  );
}

function DashboardScene({ p }) {
  const opacity = useRange(p, [0.69, 0.74], [0, 1]);
  const cardY = useRange(p, [0.7, 0.77], [28, 0]);
  const tilesY = useRange(p, [0.72, 0.79], [28, 0]);
  const lecture = LECTURES[ACTIVE_LECTURE];
  const totalWatched = WATCHED.reduce((a, b) => a + b, 0);

  return (
    <Motion.div className="absolute inset-0" style={{ opacity }}>
      <p className="absolute font-sans text-[28px] font-extrabold tracking-[-0.03em] text-white" style={{ left: 28, top: 84 }}>
        Welcome back
      </p>

      <Motion.div
        className="absolute flex items-center gap-[24px] rounded-[16px] px-[22px]"
        style={{ left: 28, top: 136, width: 1104, height: 118, y: cardY, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <span className="grid h-[80px] w-[140px] shrink-0 place-items-center rounded-[10px]" style={{ background: "#0F1D42" }}>
          <span className="grid h-[36px] w-[36px] place-items-center rounded-full bg-white/15 text-white">
            <FaPlay className="ml-[2px] text-[12px]" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.mint }}>Continue watching</span>
          <span className="mt-[4px] block text-[21px] font-bold text-white">{lecture.name}</span>
          <span className="block text-[14px]" style={{ color: C.muted }}>
            {tourPreview.subject} — {tourPreview.chapter} · 1:12 remaining
          </span>
          <span className="mt-[10px] block h-[6px] w-[520px] rounded-full" style={{ background: "#1E2A3C" }}>
            <span className="block h-full w-[88%] rounded-full" style={{ background: C.mint }} />
          </span>
        </span>
        <span className="flex items-center gap-[8px] rounded-[10px] px-[20px] py-[12px] text-[15px] font-semibold" style={{ background: C.mint, color: "#06111F" }}>
          <FaPlay className="text-[11px]" /> Resume
        </span>
      </Motion.div>

      <Motion.div className="absolute flex gap-[18px]" style={{ left: 28, top: 272, width: 1104, y: tilesY }}>
        {[
          ["Lectures watched", totalWatched, [0.74, 0.86]],
          ["Subjects started", SUBJECTS.length, [0.74, 0.8]],
          ["Watched this week", 18, [0.76, 0.86]],
        ].map(([label, to, input]) => (
          <div key={label} className="h-[92px] flex-1 rounded-[14px] px-[22px] py-[16px]" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <p className="text-[13px]" style={{ color: C.muted }}>{label}</p>
            <p className="mt-[6px] font-sans text-[32px] font-extrabold tracking-[-0.02em] text-white">
              <Counter p={p} input={input} to={to} />
            </p>
          </div>
        ))}
      </Motion.div>

      <div className="absolute rounded-[16px]" style={{ left: 28, top: 384, width: 1104, height: 323, background: C.panel, border: `1px solid ${C.line}` }}>
        <p className="px-[24px] pb-[6px] pt-[16px] text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          Progress by subject
        </p>
        <ul>
          {SUBJECTS.map((subject, index) => (
            <SubjectRow key={subject.name} p={p} subject={subject} watched={WATCHED[index]} index={index} />
          ))}
        </ul>
      </div>
    </Motion.div>
  );
}

function Cursor({ p }) {
  const input = [0, 0.03, 0.05, 0.09, 0.13, 0.16, 0.22, 0.28, 0.31, 0.34, 0.42, 0.47, 0.51, 0.56, 1];
  const x = useRange(p, input, [560, 408, 408, 700, 788, 788, 600, 562, 562, 562, 600, 531, 531, 640, 640]);
  const y = useRange(p, input, [300, 104, 104, 300, 371, 371, 380, 416, 416, 416, 480, 626, 626, 560, 560]);
  const opacity = useRange(p, [0, 0.32, 0.35, 0.41, 0.44, 0.56, 0.6], [1, 1, 0, 0, 1, 1, 0]);
  const rippleInput = CLICKS.flatMap((c) => [c - 0.004, c, c + 0.03]);
  const ripple = useRange(p, rippleInput, CLICKS.flatMap(() => [0, 0.7, 0]));
  const rippleScale = useRange(p, CLICKS.flatMap((c) => [c, c + 0.03]), CLICKS.flatMap(() => [0.3, 1.7]));
  return (
    <Motion.div className="pointer-events-none absolute left-0 top-0 z-10" style={{ x, y, opacity }}>
      <Motion.span
        className="absolute -left-[18px] -top-[18px] h-[36px] w-[36px] rounded-full"
        style={{ opacity: ripple, scale: rippleScale, border: `2px solid ${C.mint}` }}
      />
      <svg width="22" height="26" viewBox="0 0 22 26" className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <path d="M1.5 1.5 L1.5 20.5 L6.5 15.8 L10 24 L13.4 22.5 L9.9 14.5 L16.8 14.5 Z" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </Motion.div>
  );
}

/**
 * @param {{ progress: import("framer-motion").MotionValue<number> }} props
 *   0–1 scroll progress through the whole tour.
 */
export default function TourScreen({ progress }) {
  const reduce = useReducedMotion();
  // Reduced motion: hold one settled frame per step instead of scrubbing.
  const p = useTransform(progress, (v) => (reduce ? (v < 1 / 3 ? 0.3 : v < 2 / 3 ? 0.64 : 0.98) : v));
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const update = () => setScale(el.clientWidth / W);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} aria-hidden="true" className="relative h-full w-full overflow-hidden" style={{ background: C.bg }}>
      <div
        className="absolute left-0 top-0 select-none font-sans"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0", background: C.bg }}
      >
        <AppBar />
        <LibraryScene p={p} />
        <PlayerScene p={p} />
        <DashboardScene p={p} />
        <Cursor p={p} />
      </div>
    </div>
  );
}
