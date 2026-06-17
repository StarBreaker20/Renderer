"use client";

import type { PlayerRef } from "@remotion/player";
import type { Overlay } from "@/lib/types";
import { useEditorStore } from "@/store/useEditorStore";

export function LayersPanel({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const overlays = useEditorStore((s) => s.overlays);
  const selectedId = useEditorStore((s) => s.selectedId);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const select = useEditorStore((s) => s.select);
  const reorderOverlay = useEditorStore((s) => s.reorderOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);

  // Render top-most layer first (last in array = drawn on top).
  const ordered = [...overlays].reverse();

  const onSelect = (o: Overlay) => {
    select(o.id);
    // Jump to where the overlay is visible so its handles appear on canvas.
    const visible =
      currentFrame >= o.startFrame &&
      currentFrame < o.startFrame + o.durationInFrames;
    if (!visible) playerRef.current?.seekTo(o.startFrame);
  };

  return (
    <div>
      <h3 className="field-label">Layers</h3>
      {ordered.length === 0 ? (
        <p className="text-[11px] text-muted">No overlays yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ordered.map((o) => (
            <li
              key={o.id}
              onClick={() => onSelect(o)}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${
                o.id === selectedId
                  ? "bg-accent/20 text-gray-50"
                  : "hover:bg-panel2 text-gray-300"
              }`}
            >
              <span className="text-sm">{icon(o)}</span>
              <span className="min-w-0 flex-1 truncate">{label(o)}</span>
              <span className="font-mono text-[10px] text-muted">
                {o.startFrame}–{o.startFrame + o.durationInFrames}
              </span>
              <button
                className="text-muted hover:text-gray-100"
                title="Bring forward"
                onClick={(e) => {
                  e.stopPropagation();
                  reorderOverlay(o.id, "up");
                }}
              >
                ↑
              </button>
              <button
                className="text-muted hover:text-gray-100"
                title="Send backward"
                onClick={(e) => {
                  e.stopPropagation();
                  reorderOverlay(o.id, "down");
                }}
              >
                ↓
              </button>
              <button
                className="text-muted hover:text-red-400"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOverlay(o.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function icon(o: Overlay) {
  return o.type === "text" ? "T" : o.type === "image" ? "🖼" : "▢";
}
function label(o: Overlay) {
  if (o.type === "text") return o.text || "Text";
  if (o.type === "image") return "Logo / Image";
  return `Shape · ${o.shape}`;
}
