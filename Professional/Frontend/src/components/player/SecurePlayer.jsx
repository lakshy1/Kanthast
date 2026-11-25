import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowRight, CornersIn, CornersOut, Pause, Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import SecureWatermark from "../SecureWatermark";
import { API_BASE_URL } from "../../utils/apiBase";
import "./player.css";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const IDLE_MS = 2600;
const NEXT_SECONDS = 5;
const ANOTHER_DEVICE = "This account started watching on another device. Press Try again to continue here.";

const clock = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
};

const canFullscreen = () => typeof document !== "undefined" && Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

/**
 * The lecture player for encrypted lectures. It streams through hls.js (our server checks the student on every
 * request), keeps one stream per account, and draws its own minimal controls so the watermark always stays on screen.
 */
export default function SecurePlayer({
  src,
  lectureId,
  title,
  user,
  videoRef: externalRef,
  rate,
  onRate,
  flash,
  nextTitle,
  autoplayNext,
  onPlayNext,
  onLoaded,
  onProgress,
  onEnded,
}) {
  const ownRef = useRef(null);
  const videoRef = externalRef || ownRef;
  const boxRef = useRef(null);
  const hlsRef = useRef(null);
  const seekRef = useRef(null);
  const playedRef = useRef(null);
  const bufferRef = useRef(null);
  const thumbRef = useRef(null);
  const rangeRef = useRef(null);
  const idleTimer = useRef(null);
  const tapRef = useRef({ time: 0, side: "", timer: null });

  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [duration, setDuration] = useState(0);
  const [clockNow, setClockNow] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [menu, setMenu] = useState(null); // "speed" | "quality" | null
  const [levels, setLevels] = useState([]);
  const [level, setLevel] = useState(-1); // -1 = auto
  const [autoHeight, setAutoHeight] = useState(0);
  const [active, setActive] = useState(true);
  const [focusIn, setFocusIn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState({ x: 0, t: 0 });
  const [ripple, setRipple] = useState(null); // { side, key }
  const [fullscreen, setFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(NEXT_SECONDS);

  // Keep the latest callbacks without re-attaching the stream when they change.
  const cb = useRef({});
  cb.current = { onLoaded, onProgress, onEnded };

  /* ---------- activity: controls show on movement, hide after a short idle while playing ---------- */
  const poke = useCallback(() => {
    setActive(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setActive(false), IDLE_MS);
  }, []);
  useEffect(() => {
    poke();
    return () => clearTimeout(idleTimer.current);
  }, [poke]);
  const controlsVisible = !playing || active || focusIn || Boolean(menu) || dragging || Boolean(error) || ended;

  /* ---------- stream: hls.js, our own login on our own requests, one stream per account ---------- */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    let hls;
    let beat;
    let cancelled = false;
    setError("");
    setEnded(false);
    setBuffering(true);
    (async () => {
      const { default: Hls } = await import("hls.js");
      if (cancelled || !videoRef.current) return;
      if (!Hls.isSupported()) {
        setError("This browser cannot play protected lectures. Try Chrome, Edge, Firefox or the latest Safari.");
        return;
      }
      const token = localStorage.getItem("kanthastToken") || "";
      // Each start gets its own id. A newer start (here or on another device) replaces it and this one is told to stop.
      const streamId = crypto.randomUUID();
      setSessionCode(streamId.replace(/[^a-f0-9]/gi, "").slice(0, 4).toUpperCase());
      hls = new Hls({
        capLevelToPlayerSize: true,
        xhrSetup: (xhr, url) => {
          if (url.includes("/playback/")) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.setRequestHeader("X-Stream-Id", streamId);
          }
        },
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => setLevels(data.levels.map((l, index) => ({ index, height: l.height })).sort((a, b) => b.height - a.height)));
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setAutoHeight(hls.levels[data.level]?.height || 0));
      hls.on(Hls.Events.ERROR, (_e, details) => {
        if (!details.fatal) return;
        const code = details.response?.code;
        setBuffering(false);
        setError(
          code === 401 ? "Log in to watch this lecture."
            : code === 409 ? ANOTHER_DEVICE
              : code === 403 ? "This lesson needs an active plan."
                : "This lesson could not be loaded. Check your connection and try again."
        );
      });
      // Report in every 25 seconds while playing: it keeps the watch log and finds out if we were replaced.
      let watched = 0;
      beat = setInterval(async () => {
        const v = videoRef.current;
        if (!v || v.paused) return;
        watched += 25;
        try {
          const response = await fetch(`${API_BASE_URL}/playback/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ streamId, lectureId, watchedSeconds: watched }),
          });
          if (response.status === 409) {
            v.pause();
            setError(ANOTHER_DEVICE);
          }
        } catch {
          // offline: the next beat tries again
        }
      }, 25000);
      hls.loadSource(src);
      hls.attachMedia(el);
    })();
    return () => {
      cancelled = true;
      clearInterval(beat);
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src, lectureId, attempt, videoRef]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate || 1;
  }, [rate, videoRef, duration]);

  /* ---------- smooth progress: write straight to the bar, no React render per frame ---------- */
  useEffect(() => {
    let frame;
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration) {
        const p = Math.min(1, v.currentTime / v.duration);
        if (playedRef.current) playedRef.current.style.transform = `scaleX(${p})`;
        if (thumbRef.current) thumbRef.current.style.left = `${p * 100}%`;
        if (rangeRef.current && !dragging) rangeRef.current.value = String(v.currentTime);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging, videoRef]);

  const updateBuffered = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !bufferRef.current) return;
    let end = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= v.currentTime + 0.5) end = Math.max(end, v.buffered.end(i));
    }
    bufferRef.current.style.transform = `scaleX(${Math.min(1, end / v.duration)})`;
  };

  /* ---------- actions ---------- */
  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  }, [videoRef]);
  const seekBy = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || Infinity);
  }, [videoRef]);
  const toggleFullscreen = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (box.requestFullscreen || box.webkitRequestFullscreen)?.call(box);
  }, []);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);
  // F toggles fullscreen. Every other shortcut (Space, K, J, L, arrows, M, < >) lives on the lesson page.
  useEffect(() => {
    const onKey = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if ((event.key === "f" || event.key === "F") && !/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "") && canFullscreen()) {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  /* ---------- pointer: click toggles, double click = fullscreen; touch: double tap left/right = back/forward 10s ---------- */
  const onSurfacePointerUp = (event) => {
    poke();
    if (event.pointerType !== "touch") return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const side = x < rect.width / 3 ? "back" : x > (rect.width * 2) / 3 ? "forward" : "middle";
    const tap = tapRef.current;
    const now = Date.now();
    event.preventDefault();
    if (now - tap.time < 300 && side === tap.side && side !== "middle") {
      clearTimeout(tap.timer);
      tap.time = 0;
      seekBy(side === "forward" ? 10 : -10);
      setRipple({ side, key: now });
      return;
    }
    tap.time = now;
    tap.side = side;
    clearTimeout(tap.timer);
    // A single tap waits a moment in case a second one follows.
    tap.timer = setTimeout(() => (active ? toggle() : poke()), 260);
  };
  const onSurfaceClick = (event) => {
    if (event.pointerType === "touch" || event.nativeEvent.pointerType === "touch") return;
    toggle();
  };

  /* ---------- seek bar ---------- */
  const onSeekMove = (event) => {
    const rect = seekRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover({ x: ratio * rect.width, t: ratio * duration });
  };

  /* ---------- up next ---------- */
  useEffect(() => {
    if (!ended || !nextTitle || !autoplayNext) return undefined;
    setCountdown(NEXT_SECONDS);
    const timer = setInterval(() => setCountdown((n) => n - 1), 1000);
    return () => clearInterval(timer);
  }, [ended, nextTitle, autoplayNext]);
  useEffect(() => {
    if (ended && nextTitle && autoplayNext && countdown <= 0) onPlayNext?.();
  }, [countdown, ended, nextTitle, autoplayNext, onPlayNext]);

  const resolution = level === -1 ? (autoHeight ? `Auto · ${autoHeight}p` : "Auto") : `${levels.find((l) => l.index === level)?.height}p`;
  const fullscreenOk = canFullscreen();

  return (
    <div
      ref={boxRef}
      className="sp rounded-card border border-line"
      data-controls={controlsVisible}
      data-idle={playing && !controlsVisible}
      role="region"
      aria-label={`Video player: ${title}`}
      onPointerMove={poke}
      onPointerDown={poke}
      // Only keyboard focus keeps the controls up; a mouse click leaves focus on a button but should not pin them.
      onFocus={(e) => setFocusIn(Boolean(e.target.matches?.(":focus-visible")))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocusIn(false)}
      onKeyDown={(e) => {
        poke();
        if (e.key === "Escape" && menu) {
          e.stopPropagation();
          setMenu(null);
        }
      }}
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        aria-label={title}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          setBuffering(false);
          e.currentTarget.playbackRate = rate || 1;
          cb.current.onLoaded?.(e.currentTarget);
        }}
        onTimeUpdate={(e) => {
          setClockNow(e.currentTarget.currentTime);
          updateBuffered();
          cb.current.onProgress?.(e.currentTarget);
        }}
        onProgress={updateBuffered}
        onPlay={() => { setPlaying(true); setStarted(true); setEnded(false); poke(); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setError(""); }}
        onCanPlay={() => setBuffering(false)}
        onVolumeChange={(e) => { setMuted(e.currentTarget.muted); setVolume(e.currentTarget.volume); }}
        onEnded={() => { setEnded(true); setPlaying(false); cb.current.onEnded?.(); }}
      />

      <SecureWatermark user={user} code={sessionCode} />

      {/* tap / click surface */}
      <div className="absolute inset-0 z-[5]" onPointerUp={onSurfacePointerUp} onClick={onSurfaceClick} onDoubleClick={(e) => { if (e.pointerType !== "touch" && fullscreenOk) toggleFullscreen(); }} />

      <div className="sp-center" aria-hidden={!buffering && playing}>
        {buffering && !error && !ended ? <span className="sp-spin" role="status" aria-label="Loading" /> : null}
        {!playing && !buffering && !error && !ended ? (
          <button type="button" className="sp-bigplay" onClick={toggle} aria-label={started ? "Resume" : "Play lesson"}>
            <Play weight="fill" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {ripple && (
        <span key={ripple.key} className="sp-ripple" style={ripple.side === "forward" ? { right: "12%" } : { left: "12%" }} aria-hidden="true" onAnimationEnd={() => setRipple(null)}>
          {ripple.side === "forward" ? "10s ▶▶" : "◀◀ 10s"}
        </span>
      )}
      {flash ? <span className="sp-flash" role="status">{flash}</span> : null}

      {error && (
        <div className="sp-end" role="alert">
          <div>
            <p className="text-base font-semibold">{error}</p>
            <button type="button" className="sp-pill sp-pill-main mt-4" onClick={() => { setError(""); setAttempt((n) => n + 1); }}>
              <ArrowCounterClockwise weight="bold" aria-hidden="true" /> Try again
            </button>
          </div>
        </div>
      )}

      {ended && !error && (
        <div className="sp-end">
          <div className="grid gap-3">
            {nextTitle ? (
              <>
                <p className="text-sm font-semibold text-white/70">Up next</p>
                <p className="text-lg font-bold">{nextTitle}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button type="button" className="sp-pill sp-pill-main" onClick={() => onPlayNext?.()}>
                    <ArrowRight weight="bold" aria-hidden="true" /> {autoplayNext && countdown > 0 ? `Play now · ${countdown}` : "Play next"}
                  </button>
                  <button type="button" className="sp-pill sp-pill-ghost" onClick={() => { const v = videoRef.current; v.currentTime = 0; v.play().catch(() => {}); }}>
                    <ArrowCounterClockwise weight="bold" aria-hidden="true" /> Watch again
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="sp-pill sp-pill-main mx-auto" onClick={() => { const v = videoRef.current; v.currentTime = 0; v.play().catch(() => {}); }}>
                <ArrowCounterClockwise weight="bold" aria-hidden="true" /> Watch again
              </button>
            )}
          </div>
        </div>
      )}

      {/* controls */}
      <div className="sp-bar" onPointerDown={(e) => e.stopPropagation()}>
        <div
          ref={seekRef}
          className="sp-seek"
          data-drag={dragging}
          onPointerMove={onSeekMove}
        >
          <div className="sp-track" aria-hidden="true">
            <div ref={bufferRef} className="sp-buffer" />
            <div ref={playedRef} className="sp-played" />
          </div>
          <span ref={thumbRef} className="sp-thumb" aria-hidden="true" />
          <span className="sp-tip" style={{ left: hover.x }} aria-hidden="true">{clock(hover.t)}</span>
          <input
            ref={rangeRef}
            type="range"
            className="sp-range"
            min={0}
            max={duration || 0}
            step={0.1}
            defaultValue={0}
            aria-label="Seek"
            aria-valuetext={`${clock(clockNow)} of ${clock(duration)}`}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onBlur={() => setDragging(false)}
            onInput={(e) => { const v = videoRef.current; if (v) v.currentTime = Number(e.currentTarget.value); }}
          />
        </div>

        <div className="sp-row">
          <button type="button" className="sp-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause weight="fill" aria-hidden="true" /> : <Play weight="fill" aria-hidden="true" />}
          </button>

          <div className="sp-vol">
            <button type="button" className="sp-btn" onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }} aria-label={muted || volume === 0 ? "Unmute" : "Mute"}>
              {muted || volume === 0 ? <SpeakerSlash weight="fill" aria-hidden="true" /> : <SpeakerHigh weight="fill" aria-hidden="true" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} aria-label="Volume"
              onChange={(e) => { const v = videoRef.current; if (!v) return; v.volume = Number(e.target.value); v.muted = Number(e.target.value) === 0; }} />
          </div>

          <span className="sp-text" aria-hidden="true">{clock(clockNow)} / {clock(duration)}</span>
          <span className="sp-spacer" />

          {levels.length > 1 && (
            <button type="button" className="sp-btn sp-text" aria-haspopup="menu" aria-expanded={menu === "quality"} onClick={() => setMenu(menu === "quality" ? null : "quality")} aria-label={`Quality: ${resolution}`}>
              {level === -1 ? "Auto" : `${levels.find((l) => l.index === level)?.height}p`}
            </button>
          )}
          <button type="button" className="sp-btn sp-text" aria-haspopup="menu" aria-expanded={menu === "speed"} onClick={() => setMenu(menu === "speed" ? null : "speed")} aria-label={`Speed: ${rate}×`}>
            {rate}×
          </button>
          {fullscreenOk && (
            <button type="button" className="sp-btn" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {fullscreen ? <CornersIn weight="bold" aria-hidden="true" /> : <CornersOut weight="bold" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      {menu === "speed" && (
        <div className="sp-menu" role="menu" aria-label="Playback speed">
          {RATES.map((r) => (
            <button key={r} type="button" role="menuitemradio" aria-checked={r === rate} className="sp-item" onClick={() => { onRate?.(r); setMenu(null); }}>
              {r}× {r === rate ? "✓" : ""}
            </button>
          ))}
        </div>
      )}
      {menu === "quality" && (
        <div className="sp-menu" role="menu" aria-label="Quality">
          {[{ index: -1, label: "Auto" }, ...levels.map((l) => ({ index: l.index, label: `${l.height}p` }))].map((item) => (
            <button key={item.index} type="button" role="menuitemradio" aria-checked={item.index === level} className="sp-item"
              onClick={() => { setLevel(item.index); if (hlsRef.current) hlsRef.current.currentLevel = item.index; setMenu(null); }}>
              {item.label} {item.index === level ? "✓" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
