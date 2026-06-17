"use client";

import { useMemo } from "react";
import { Thumbnail, type PlayerRef } from "@remotion/player";
import { VideoEditorComposition } from "@/remotion/VideoEditorComposition";
import { useEditorStore } from "@/store/useEditorStore";

const FRAME_COUNT = 12;

/**
 * Appears whenever the video is paused. Shows the current frame plus the next
 * frames as deterministic thumbnails (rendered by the same composition, so the
 * overlays you've added show up here too). Click any frame to jump to it.
 */
export function Filmstrip({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const overlays = useEditorStore((s) => s.overlays);
  const currentFrame = useEditorStore((s) => s.currentFrame);

  const last = project.durationInFrames - 1;

  const inputProps = useMemo(
    () => ({
      src: project.src,
      overlays,
      backgroundColor: project.backgroundColor,
    }),
    [project.src, project.backgroundColor, overlays],
  );

  const frames = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const f = currentFrame + i;
      if (f > last) break;
      out.push(f);
    }
    return out;
  }, [currentFrame, last]);

  const thumbW = 132;
  const thumbH = Math.round(thumbW / (project.width / project.height));

  return (
    <div className="shrink-0 border-t border-edge bg-panel2 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Paused · frame {currentFrame} and next {frames.length - 1}
        </span>
        <span className="text-[11px] text-muted">Click a frame to jump</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {frames.map((f) => (
          <button
            key={f}
            onClick={() => playerRef.current?.seekTo(f)}
            className={`group relative shrink-0 overflow-hidden rounded border ${
              f === currentFrame
                ? "border-accent ring-1 ring-accent"
                : "border-edge hover:border-muted"
            }`}
            style={{ width: thumbW, height: thumbH }}
            title={`Frame ${f}`}
          >
            <Thumbnail
              component={VideoEditorComposition}
              inputProps={inputProps}
              compositionWidth={project.width}
              compositionHeight={project.height}
              frameToDisplay={f}
              durationInFrames={project.durationInFrames}
              fps={project.fps}
              style={{ width: thumbW, height: thumbH }}
            />
            <span className="absolute bottom-0 right-0 bg-black/70 px-1 text-[10px] tabular-nums text-gray-200">
              {f}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
