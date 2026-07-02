import { useEffect, useRef } from "react";
import { FaXmark } from "react-icons/fa6";

export default function DemoVideoModal({ open, onClose, src, ariaLabel = "Demo video" }) {
  const videoRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close demo video"
        >
          <FaXmark />
        </button>
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          className="h-[82vh] w-full bg-black object-contain"
        />
      </div>
    </div>
  );
}
