import { createId } from "./id";
import type { Overlay, OverlayType } from "./types";

/**
 * Build a sensible default overlay of the given type, centered on the canvas
 * and starting at the current frame. Duration defaults to ~2s but is clamped to
 * what's left in the video.
 */
export function makeOverlay(
  type: OverlayType,
  opts: {
    startFrame: number;
    fps: number;
    durationInFrames: number;
    canvasWidth: number;
    canvasHeight: number;
  },
): Overlay {
  const { startFrame, fps, durationInFrames, canvasWidth, canvasHeight } = opts;
  const remaining = Math.max(1, durationInFrames - startFrame);
  const dur = Math.min(remaining, Math.round(fps * 2));

  const base = {
    id: createId(type),
    startFrame,
    durationInFrames: dur,
    rotation: 0,
    opacity: 1,
    fadeInFrames: 0,
    fadeOutFrames: 0,
  };

  if (type === "text") {
    const width = Math.round(canvasWidth * 0.6);
    const height = Math.round(canvasHeight * 0.16);
    return {
      ...base,
      type: "text",
      text: "Your text",
      color: "#ffffff",
      backgroundColor: "transparent",
      fontSize: Math.round(canvasHeight * 0.07),
      fontWeight: 700,
      fontFamily: "Inter, system-ui, sans-serif",
      textAlign: "center",
      lineHeight: 1.2,
      letterSpacing: 0,
      padding: 8,
      borderRadius: 0,
      x: Math.round((canvasWidth - width) / 2),
      y: Math.round((canvasHeight - height) / 2),
      width,
      height,
    };
  }

  if (type === "shape") {
    const size = Math.round(canvasHeight * 0.25);
    return {
      ...base,
      type: "shape",
      shape: "rectangle",
      fill: "#6d8bff",
      stroke: "transparent",
      strokeWidth: 0,
      borderRadius: 16,
      x: Math.round((canvasWidth - size) / 2),
      y: Math.round((canvasHeight - size) / 2),
      width: size,
      height: size,
    };
  }

  // image
  const w = Math.round(canvasWidth * 0.2);
  const h = w;
  return {
    ...base,
    type: "image",
    src: "",
    objectFit: "contain",
    borderRadius: 0,
    x: Math.round(canvasWidth * 0.04),
    y: Math.round(canvasHeight * 0.04),
    width: w,
    height: h,
  };
}
