import { useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaArrowRight,
  FaBrain,
  FaVolumeHigh,
  FaVolumeXmark,
  FaExpand,
  FaCompress,
} from "react-icons/fa6";
import { MdOndemandVideo } from "react-icons/md";
import TiltCard3D from "./TiltCard3D";

const POINTS = [
  { icon: MdOndemandVideo, label: ["Engaging", "Animations"] },
  { icon: FaBrain, label: ["Smart AI", "Assistance"] },
];

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Landing video showcase: "Watch. Learn. Retain." with custom 3D protected player. */
export default function BrandWatch() {
  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const reduce = useReducedMotion();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
      setFullscreen(true);
    }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
  };

  return (
    <section className="bwa" aria-labelledby="bwa-title">
      <span className="bwa-dots" aria-hidden="true" />
      <div className="bwa-inner">
        <div className="bwa-copy">
          <p className="bh-eyebrow">
            <FaPlay aria-hidden="true" className="bh-eyebrow-icon" />
            Animated Learning Experience
          </p>
          <svg className="bwa-spark" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M6 22 L 11 30" /><path d="M16 12 L 18 26" /><path d="M24 30 L 34 24" />
          </svg>
          <h2 id="bwa-title" className="bwa-title">
            Watch. Learn.
            <br />
            <span className="bh-click bh-accent">
              Retain
              <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 13 C 50 5, 120 3, 197 9" />
              </svg>
            </span>
            <span className="bh-accent">.</span>
          </h2>
          <p className="bwa-sub">
            Beautifully animated videos and lessons that make complex topics simple and engaging.
          </p>
          <ul className="bwa-points">
            {/* eslint-disable-next-line no-unused-vars */}
            {POINTS.map(({ icon: Icon, label }) => (
              <li key={label.join(" ")}>
                <span className="bwa-point-icon" aria-hidden="true"><Icon /></span>
                <span>{label[0]}<br />{label[1]}</span>
              </li>
            ))}
          </ul>
          <a href="#products" className="bh-btn bh-btn-primary bwa-cta">
            Explore Animated Lessons
            <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
          </a>
        </div>

        <div className="bwa-art">
          <TiltCard3D
            as="div"
            spotlightColor="rgba(37, 99, 235, 0.16)"
            className="rounded-3xl border border-ink/10 bg-slate-950 p-1.5 shadow-[0_28px_70px_-18px_rgba(15,23,42,0.35)]"
          >
            <div
              ref={shellRef}
              onContextMenu={(e) => e.preventDefault()}
              className="group relative overflow-hidden rounded-[20px] bg-slate-950 select-none"
            >
              <video
                ref={videoRef}
                className="block w-full aspect-video object-cover pointer-events-none"
                muted={muted}
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={(e) => e.preventDefault()}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  setCurrentTime(v.currentTime);
                  if (v.duration) setProgress((v.currentTime / v.duration) * 100);
                }}
                poster={`${import.meta.env.BASE_URL}hero-lesson.webp`}
                src={`${import.meta.env.BASE_URL}hero-lesson.mp4`}
                aria-label="A short clip from the Kanthast School Class VIII Science lesson From Wonder to Investigation, with Neo the owl and Zippy the spark."
                width="932"
                height="524"
              />

              {/* Transparent shield to toggle play/pause and block right-click save */}
              <button
                type="button"
                onClick={togglePlay}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={playing ? "Pause lesson preview" : "Play lesson preview"}
                className="absolute inset-0 z-10 flex items-center justify-center bg-transparent focus:outline-none"
              >
                <motion.span
                  initial={false}
                  animate={{
                    scale: playing ? 0.85 : 1,
                    opacity: playing ? 0 : 1,
                  }}
                  whileHover={reduce ? undefined : { scale: 1.08 }}
                  whileTap={reduce ? undefined : { scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 360, damping: 24 }}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl backdrop-blur-md group-hover:opacity-100"
                >
                  {playing ? (
                    <FaPause className="text-lg" aria-hidden="true" />
                  ) : (
                    <FaPlay className="ml-0.5 text-lg" aria-hidden="true" />
                  )}
                </motion.span>
              </button>

              {/* Top-left live lesson badge */}
              <div className="pointer-events-none absolute left-3.5 top-3.5 z-20 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Class VIII Science · Preview
              </div>

              {/* Bottom frosted-glass controls (no download option) */}
              <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-2xl bg-black/55 px-3.5 py-2 text-white backdrop-blur-md transition-opacity duration-200 opacity-95 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
                >
                  {playing ? <FaPause className="text-xs" aria-hidden="true" /> : <FaPlay className="ml-0.5 text-xs" aria-hidden="true" />}
                </button>

                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Seek lesson preview"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  onClick={handleSeek}
                  className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/25 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className="hidden sm:inline text-[11px] font-medium tabular-nums text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
                >
                  {muted ? <FaVolumeXmark className="text-xs" aria-hidden="true" /> : <FaVolumeHigh className="text-xs" aria-hidden="true" />}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
                >
                  {fullscreen ? <FaCompress className="text-xs" aria-hidden="true" /> : <FaExpand className="text-xs" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </TiltCard3D>
          <p className="bwa-caption mt-3">A real clip from Kanthast School, Class VIII Science.</p>
        </div>
      </div>
    </section>
  );
}
