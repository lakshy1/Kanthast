import React from "react";
import {
  FaBacterium,
  FaBatteryFull,
  FaBookOpen,
  FaBrain,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaClosedCaptioning,
  FaDna,
  FaExpand,
  FaGear,
  FaHouse,
  FaMagnifyingGlass,
  FaPause,
  FaPills,
  FaPlay,
  FaRegBell,
  FaRegUser,
  FaShieldVirus,
  FaSignal,
  FaVolumeHigh,
  FaWifi,
} from "react-icons/fa6";

// The two screens inside the homepage hero's MacBook and iPhone. They are
// rendered once at the devices' exact glass size and baked to
// public/device-*-screen.png, so the hero ships static images. Lecture names
// and durations come from the real Pharmacology → Cardiovascular Drugs
// chapter; progress values are a sample signed-in state.

const HERO_CHAPTER = {
  subject: "Pharmacology",
  chapter: "Cardiovascular Drugs",
  lectures: [
    { name: "Ivabradine", duration: "10:10" },
    { name: "Nitroprusside", duration: "09:45" },
    { name: "DHP Calcium Channel Blockers", duration: "17:18" },
    { name: "Hydralazine", duration: "16:08" },
    { name: "Fenoldopam", duration: "10:51" },
    { name: "Nitrates", duration: "23:12" },
  ],
  activeIndex: 1,
  position: "04:32",
};

const MINT = "#6BECC9";

// Laptop glass: 659 × 417 CSS px at a 1672px-wide hero.
export function DesktopPlayerScreen({ frameSrc }) {
  const active = HERO_CHAPTER.lectures[HERO_CHAPTER.activeIndex];
  return (
    <div className="flex h-full w-full flex-col bg-[#070F1C] font-sans text-[#E3E9F1]">
      <div className="flex h-[44px] shrink-0 items-center border-b border-[#18243A] px-[20px]">
        <span className="font-display text-[13px] font-extrabold tracking-[-0.02em] text-white">Kanthast</span>
        <span className="ml-[7px] flex items-center gap-[3px] text-[7.5px] font-medium text-[#7F9BC0]">
          Medical <FaChevronDown className="text-[5.5px]" />
        </span>
        <span className="ml-auto mr-auto flex items-center gap-[17px] pl-[48px] text-[8.5px] text-[#C9D3E0]">
          <span>Home</span>
          <span className="flex items-center gap-[3px]">
            Courses <FaChevronDown className="text-[5.5px]" />
          </span>
          <span>Library</span>
          <span>Pricing</span>
          <span>About</span>
          <span>Contact</span>
        </span>
        <FaMagnifyingGlass className="mr-[20px] text-[10px] text-[#C9D3E0]" />
        <span className="grid h-[24px] w-[24px] place-items-center rounded-full bg-[#4A7FD9] text-[10px] font-semibold text-white">
          A
        </span>
      </div>

      <div className="flex min-h-0 flex-1 gap-[17px] px-[17px] pt-[14px]">
        <div className="w-[370px] shrink-0">
          <p className="flex items-center gap-[5px] text-[8.5px] text-[#93A3B8]">
            {HERO_CHAPTER.subject} <FaChevronRight className="text-[5px]" /> {HERO_CHAPTER.chapter}
            <FaChevronRight className="text-[5px]" /> {active.name}
          </p>
          <div className="mt-[9px] flex items-center gap-[10px]">
            <span className="grid h-[27px] w-[27px] place-items-center rounded-full border-[1.5px] border-white">
              <FaPlay className="ml-[2px] text-[10px] text-white" />
            </span>
            <span className="font-display text-[19px] font-semibold tracking-[-0.01em] text-white">{active.name}</span>
          </div>
          <div className="mt-[10px] h-[214px] overflow-hidden rounded-[6px] bg-[#0A1528]">
            <img src={frameSrc} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative mt-[12px] h-[3px] rounded-full bg-[#2A3446]">
            <div className="absolute inset-y-0 left-0 w-[47%] rounded-full bg-[#4A5568]" />
            <div className="absolute inset-y-0 left-0 w-[36%] rounded-full" style={{ background: MINT }} />
            <span
              className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: "36%", background: MINT }}
            />
          </div>
          <div className="mt-[12px] flex items-center gap-[13px] text-[11px] text-[#D5DDE8]">
            <FaPause />
            <FaVolumeHigh />
            <span className="text-[8.5px] tabular-nums">
              {HERO_CHAPTER.position} / {active.duration}
            </span>
            <span className="ml-auto text-[10px] font-semibold">1x</span>
            <FaClosedCaptioning />
            <FaGear />
            <FaExpand />
          </div>
        </div>

        <div className="mb-[12px] min-w-0 flex-1 rounded-[8px] bg-[#0C1627]">
          <div className="flex h-[38px] items-end gap-[20px] border-b border-[#1B2638] px-[12px] text-[9.5px]">
            <span className="border-b-2 pb-[9px] font-semibold" style={{ color: MINT, borderColor: MINT }}>
              Lectures
            </span>
            <span className="pb-[11px] text-[#93A3B8]">Notes</span>
            <span className="pb-[11px] text-[#93A3B8]">Images</span>
          </div>
          <ul className="space-y-[4px] px-[8px] pt-[8px]">
            {HERO_CHAPTER.lectures.map((lecture, index) => {
              const isActive = index === HERO_CHAPTER.activeIndex;
              return (
                <li
                  key={lecture.name}
                  className={`flex h-[44px] items-center gap-[10px] rounded-[6px] px-[8px] ${isActive ? "bg-[#152238]" : ""}`}
                >
                  {isActive ? (
                    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: MINT }}>
                      <FaPlay className="ml-[1px] text-[7px] text-[#07111F]" />
                    </span>
                  ) : (
                    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.3px] border-[#C9D3E0]">
                      <FaPlay className="ml-[1px] text-[6.5px] text-[#C9D3E0]" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[9px] font-medium text-[#E3E9F1]">{lecture.name}</span>
                    <span
                      className="mt-[2px] block text-[8px] tabular-nums"
                      style={{ color: isActive ? MINT : "#8193A8" }}
                    >
                      {lecture.duration}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SUBJECTS = [
  { name: "Biochemistry", icon: FaDna, tile: "#DCE9FF", ink: "#3B7BF0", progress: 62 },
  { name: "Immunology", icon: FaShieldVirus, tile: "#D6F5E8", ink: "#1FA97A", progress: 52 },
  { name: "Pharmacology", icon: FaPills, tile: "#FFEBD2", ink: "#F08A24", progress: 66 },
  { name: "Microbiology", icon: FaBacterium, tile: "#E6E1FC", ink: "#7C5CE6", progress: 63 },
  { name: "Neuroanatomy", icon: FaBrain, tile: "#D2F4F0", ink: "#17A99A", progress: 38 },
];

// Phone glass: 190 × 439 CSS px at a 1672px-wide hero.
export function PhoneHomeScreen({ thumbSrc }) {
  const active = HERO_CHAPTER.lectures[HERO_CHAPTER.activeIndex];
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F3F6FB] font-sans text-[#0F1B33]">
      <div className="flex h-[26px] items-end justify-between px-[16px] pb-[3px] text-[7px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-[2.5px] text-[5.5px]">
          <FaSignal />
          <FaWifi />
          <FaBatteryFull className="text-[7px]" />
        </span>
      </div>

      <div className="mt-[9px] flex items-center px-[10px]">
        <span className="grid h-[18px] w-[18px] place-items-center rounded-[4px] bg-[#1E3A8A] text-[9.5px] font-extrabold text-white">
          K
        </span>
        <span className="ml-[6px] font-display text-[10px] font-bold">Kanthast</span>
        <FaRegBell className="ml-auto text-[9px] text-[#334155]" />
      </div>

      <p className="mt-[13px] px-[10px] font-display text-[14px] font-extrabold tracking-[-0.01em]">Welcome back</p>

      <div className="mx-[9px] mt-[8px] rounded-[8px] bg-white p-[9px] shadow-[0_4px_12px_-4px_rgba(15,27,51,0.12)]">
        <p className="text-[7.5px] font-semibold text-[#1F2A3D]">Continue watching</p>
        <div className="mt-[6px] flex gap-[9px]">
          <img src={thumbSrc} alt="" className="h-[50px] w-[42px] shrink-0 rounded-[4px] object-cover object-[42%_50%]" />
          <div className="min-w-0 flex-1 pt-[3px]">
            <p className="truncate text-[8.5px] font-bold">{active.name}</p>
            <p className="mt-[2px] text-[7px] text-[#6B7A90]">{HERO_CHAPTER.subject}</p>
            <div className="mt-[7px] h-[2.5px] rounded-full bg-[#E2E8F0]">
              <div className="h-full w-[46%] rounded-full bg-[#34C79A]" />
            </div>
            <p className="mt-[5px] text-right text-[6.5px] tabular-nums text-[#6B7A90]">
              {HERO_CHAPTER.position} / {active.duration}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-[13px] flex items-baseline justify-between px-[10px]">
        <p className="font-display text-[10.5px] font-extrabold">Your subjects</p>
        <p className="text-[8px] font-semibold text-[#3B82F6]">See all</p>
      </div>

      <ul className="mt-[6px] space-y-[5px] px-[9px]">
        {SUBJECTS.map(({ name, icon: Icon, tile, ink, progress }) => (
          <li key={name} className="flex h-[35px] items-center gap-[9px] rounded-[8px] bg-white/70 px-[5px]">
            <span className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-[7px]" style={{ background: tile }}>
              <Icon className="text-[11px]" style={{ color: ink }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[8.5px] font-bold text-[#1F2A3D]">{name}</span>
              <span className="mt-[4px] block h-[2.5px] rounded-full bg-[#E2E8F0]">
                <span className="block h-full rounded-full bg-[#34C79A]" style={{ width: `${progress}%` }} />
              </span>
            </span>
            <FaChevronRight className="shrink-0 text-[7px] text-[#64748B]" />
          </li>
        ))}
      </ul>

      <div className="absolute inset-x-0 bottom-0 flex h-[36px] items-start justify-around border-t border-[#E5EAF1] bg-white pt-[6px]">
        {[
          ["Home", FaHouse],
          ["Library", FaBookOpen],
          ["Progress", FaChartLine],
          ["Profile", FaRegUser],
        ].map(([label, Icon], index) => (
          <span
            key={label}
            className="flex flex-col items-center gap-[2px] text-[6px] font-medium"
            style={{ color: index === 0 ? "#1FA97A" : "#8391A5" }}
          >
            <Icon className="text-[9px]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
