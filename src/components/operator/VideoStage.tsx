import { useEffect, useRef, useState } from "react";
import { BulbIcon } from "@/components/brand/Brand";
import { INTRO_VIDEO_SRC } from "@/data/config";

/**
 * The chatbot video space. Lives on the operator screen only — players never
 * see it. If `public/videos/chatbot-intro.mp4` exists it plays inside the
 * frame; otherwise the stage shows its own animated placeholder.
 *
 * The whole stage can be thrown into fullscreen (button, or automatically on
 * play) so the reel can be shown to the room on the projector.
 */
export function VideoStage({
  src = INTRO_VIDEO_SRC,
  onEnded,
}: {
  src?: string;
  /** Fires when the reel finishes — the console hands over to the games. */
  onEnded?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [full, setFull] = useState(false);
  const autoTried = useRef(false);

  /* track fullscreen so the button label flips between Present / Exit */
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === stageRef.current) {
        await document.exitFullscreen();
      } else {
        await stageRef.current?.requestFullscreen();
      }
    } catch {
      /* browser refused (permissions) — the inline player still works */
    }
  }

  return (
    <div
      ref={stageRef}
      className="video-stage relative aspect-video w-full overflow-hidden border-[3px] border-ink bg-ink shadow-[6px_6px_0_0_#0e0e0e]"
    >
      {/* fullscreen toggle — sits above the placeholder and the video */}
      <button
        type="button"
        onClick={() => void toggleFullscreen()}
        className="nb-tag absolute right-3 top-3 z-30 bg-sun text-ink hover:bg-white"
      >
        {full ? "Exit fullscreen ✕" : "Fullscreen ⛶"}
      </button>

      {/* placeholder sits underneath until the reel can play */}
      {!ready && (
        <div className="absolute inset-0 grid place-items-center gap-3 bg-ink px-6 text-center text-white">
          <div className="nb-dots absolute inset-0 opacity-20" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <BulbIcon
                on
                className="h-14 w-14"
                style={{ animation: "nb-float 3s ease-in-out infinite" }}
              />
              <span
                className="flex size-12 items-center justify-center border-[3px] border-white bg-coral text-xl text-white"
                style={{ animation: "nb-pulse-border 1.6s ease-in-out infinite" }}
              >
                ▶
              </span>
            </div>
            <p className="nb-display text-lg sm:text-xl">
              Chatbot intro reel
            </p>
            <p className="max-w-md text-xs font-medium leading-relaxed text-white/60">
              {missing
                ? `No reel found — drop your file at ${src} and it plays here automatically.`
                : "Loading the operator intro video…"}
            </p>
          </div>
        </div>
      )}

      {!missing && (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className={
            ready
              ? "relative z-10 h-full w-full bg-black object-contain"
              : "pointer-events-none absolute h-px w-px opacity-0"
          }
          onCanPlay={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onError={() => setMissing(true)}
          onPlay={() => {
            /* first play press → throw it fullscreen for the room */
            if (autoTried.current || document.fullscreenElement) return;
            autoTried.current = true;
            void stageRef.current?.requestFullscreen().catch(() => undefined);
          }}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}
