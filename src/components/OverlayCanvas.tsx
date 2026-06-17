"use client";

import { useRef } from "react";
import type { Overlay } from "@/lib/types";
import { useEditorStore } from "@/store/useEditorStore";

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

type DragState = {
  mode: DragMode;
  id: string;
  startX: number;
  startY: number;
  orig: { x: number; y: number; width: number; height: number };
};

const HANDLES: { key: DragMode; className: string; cursor: string }[] = [
  { key: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { key: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { key: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { key: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
];

const MIN = 12; // min overlay size in composition px

export function OverlayCanvas({ scale }: { scale: number }) {
  const overlays = useEditorStore((s) => s.overlays);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const drag = useRef<DragState | null>(null);

  // Only overlays visible at the current frame are directly manipulable.
  const active = overlays.filter(
    (o) =>
      currentFrame >= o.startFrame &&
      currentFrame < o.startFrame + o.durationInFrames,
  );

  const onPointerDown = (
    e: React.PointerEvent,
    overlay: Overlay,
    mode: DragMode,
  ) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    select(overlay.id);
    drag.current = {
      mode,
      id: overlay.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: {
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height,
      },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    const { x, y, width, height } = d.orig;

    if (d.mode === "move") {
      updateOverlay(d.id, { x: Math.round(x + dx), y: Math.round(y + dy) });
      return;
    }

    let nx = x;
    let ny = y;
    let nw = width;
    let nh = height;
    if (d.mode === "nw") {
      nx = x + dx;
      ny = y + dy;
      nw = width - dx;
      nh = height - dy;
    } else if (d.mode === "ne") {
      ny = y + dy;
      nw = width + dx;
      nh = height - dy;
    } else if (d.mode === "sw") {
      nx = x + dx;
      nw = width - dx;
      nh = height + dy;
    } else if (d.mode === "se") {
      nw = width + dx;
      nh = height + dy;
    }
    if (nw < MIN || nh < MIN) return;
    updateOverlay(d.id, {
      x: Math.round(nx),
      y: Math.round(ny),
      width: Math.round(nw),
      height: Math.round(nh),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    drag.current = null;
  };

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // Let clicks fall through to the stage (deselect) unless on a box.
      style={{ pointerEvents: "none" }}
    >
      {active.map((o) => {
        const selected = o.id === selectedId;
        return (
          <div
            key={o.id}
            onPointerDown={(e) => onPointerDown(e, o, "move")}
            style={{
              position: "absolute",
              left: o.x * scale,
              top: o.y * scale,
              width: o.width * scale,
              height: o.height * scale,
              transform: `rotate(${o.rotation}deg)`,
              transformOrigin: "center center",
              border: selected
                ? "1.5px solid #6d8bff"
                : "1px dashed rgba(141,147,166,0.6)",
              cursor: "move",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
          >
            {selected &&
              HANDLES.map((h) => (
                <div
                  key={h.key}
                  onPointerDown={(e) => onPointerDown(e, o, h.key)}
                  className={`absolute ${h.className}`}
                  style={{
                    width: 10,
                    height: 10,
                    background: "#6d8bff",
                    border: "1.5px solid #fff",
                    borderRadius: 2,
                    cursor: h.cursor,
                  }}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
