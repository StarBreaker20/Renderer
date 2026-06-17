"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import type { Overlay } from "@/lib/types";
import { useEditorStore } from "@/store/useEditorStore";

const ROW_H = 26;
const TYPE_COLOR: Record<Overlay["type"], string> = {
  text: "#6d8bff",
  image: "#8b5cf6",
  shape: "#22b8a6",
};

type Drag =
  | { mode: "move" | "resize-l" | "resize-r"; id: string; startX: number; orig: { start: number; dur: number } }
  | { mode: "seek" }
  | null;

export function Timeline({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const overlays = useEditorStore((s) => s.overlays);
  const selectedId = useEditorStore((s) => s.selectedId);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const select = useEditorStore((s) => s.select);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);

  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const drag = useRef<Drag>(null);

  const total = project.durationInFrames;
  const pxPerFrame = width > 0 ? width / total : 0;

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frameFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(total - 1, Math.round(x / pxPerFrame)));
  };

  const onRulerDown = (e: React.PointerEvent) => {
    drag.current = { mode: "seek" };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    playerRef.current?.seekTo(frameFromClientX(e.clientX));
  };

  const onBarDown = (
    e: React.PointerEvent,
    o: Overlay,
    mode: "move" | "resize-l" | "resize-r",
  ) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    select(o.id);
    drag.current = {
      mode,
      id: o.id,
      startX: e.clientX,
      orig: { start: o.startFrame, dur: o.durationInFrames },
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "seek") {
      playerRef.current?.seekTo(frameFromClientX(e.clientX));
      return;
    }
    const deltaFrames = Math.round((e.clientX - d.startX) / pxPerFrame);
    let start = d.orig.start;
    let dur = d.orig.dur;
    if (d.mode === "move") {
      start = Math.max(0, Math.min(total - dur, d.orig.start + deltaFrames));
    } else if (d.mode === "resize-l") {
      start = Math.max(0, Math.min(d.orig.start + d.orig.dur - 1, d.orig.start + deltaFrames));
      dur = d.orig.start + d.orig.dur - start;
    } else if (d.mode === "resize-r") {
      dur = Math.max(1, Math.min(total - d.orig.start, d.orig.dur + deltaFrames));
    }
    updateOverlay(d.id, { startFrame: start, durationInFrames: dur });
  };

  const onUp = () => {
    drag.current = null;
  };

  return (
    <div className="shrink-0 border-t border-edge bg-panel" style={{ maxHeight: 200 }}>
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Timeline
        </span>
        <span className="text-[11px] text-muted">
          {overlays.length} overlay{overlays.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        className="relative overflow-y-auto px-3 pb-3"
        style={{ maxHeight: 160 }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Ruler / seek bar */}
        <div
          ref={trackRef}
          onPointerDown={onRulerDown}
          className="relative mb-1 h-5 cursor-pointer rounded bg-panel2"
        >
          <Playhead frame={currentFrame} pxPerFrame={pxPerFrame} />
        </div>

        {/* Overlay rows */}
        <div className="relative">
          {overlays.length === 0 && (
            <p className="py-3 text-center text-xs text-muted">
              Add an overlay from the left toolbar — its bar shows here.
            </p>
          )}
          {overlays.map((o) => {
            const selected = o.id === selectedId;
            const left = o.startFrame * pxPerFrame;
            const w = Math.max(6, o.durationInFrames * pxPerFrame);
            return (
              <div key={o.id} className="relative" style={{ height: ROW_H }}>
                <div
                  onPointerDown={(e) => onBarDown(e, o, "move")}
                  className="absolute top-1 flex items-center rounded px-2 text-[11px] text-white"
                  style={{
                    left,
                    width: w,
                    height: ROW_H - 8,
                    background: TYPE_COLOR[o.type],
                    opacity: selected ? 1 : 0.7,
                    outline: selected ? "1.5px solid #fff" : "none",
                    cursor: "grab",
                  }}
                  title={label(o)}
                >
                  <span className="truncate">{label(o)}</span>
                  <span
                    onPointerDown={(e) => onBarDown(e, o, "resize-l")}
                    className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize"
                  />
                  <span
                    onPointerDown={(e) => onBarDown(e, o, "resize-r")}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize"
                  />
                </div>
              </div>
            );
          })}
          {overlays.length > 0 && (
            <Playhead frame={currentFrame} pxPerFrame={pxPerFrame} full />
          )}
        </div>
      </div>
    </div>
  );
}

function Playhead({
  frame,
  pxPerFrame,
  full,
}: {
  frame: number;
  pxPerFrame: number;
  full?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 w-px bg-red-400"
      style={{ left: frame * pxPerFrame, height: full ? "100%" : "100%" }}
    />
  );
}

function label(o: Overlay) {
  if (o.type === "text") return o.text || "Text";
  if (o.type === "image") return "Logo / Image";
  return `Shape · ${o.shape}`;
}
