"use client";

import type { PlayerRef } from "@remotion/player";
import { useEditorStore } from "@/store/useEditorStore";

export function Transport({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const saveState = useEditorStore((s) => s.saveState);

  const last = project.durationInFrames - 1;

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else p.play();
  };

  const seek = (frame: number) => {
    const f = Math.max(0, Math.min(last, frame));
    playerRef.current?.seekTo(f);
  };

  return (
    <div className="flex items-center gap-3 border-t border-edge bg-panel px-4 py-2">
      <button
        className="btn-ghost w-20"
        onClick={toggle}
        title={isPlaying ? "Pause (frames appear below)" : "Play"}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      <div className="flex items-center gap-1">
        <button className="btn-ghost px-2" onClick={() => seek(currentFrame - 1)} title="Previous frame">
          ⟨
        </button>
        <button className="btn-ghost px-2" onClick={() => seek(currentFrame + 1)} title="Next frame">
          ⟩
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={last}
        step={1}
        value={currentFrame}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1"
      />

      <div className="w-40 text-right font-mono text-xs tabular-nums text-muted">
        f{currentFrame} · {formatTime(currentFrame, project.fps)} /{" "}
        {formatTime(last, project.fps)}
      </div>

      <SaveBadge state={saveState} />
    </div>
  );
}

function SaveBadge({ state }: { state: string }) {
  const label =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Saved"
        : state === "error"
          ? "Save failed"
          : "";
  if (!label) return <span className="w-16" />;
  return (
    <span
      className={`w-16 text-right text-xs ${
        state === "error" ? "text-red-400" : "text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function formatTime(frame: number, fps: number) {
  const totalSeconds = frame / fps;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const cs = Math.floor((totalSeconds % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
