import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import type { Overlay } from "@/lib/types";

/**
 * Renders a single overlay inside its own <Sequence>, so its start frame and
 * duration are handled by Remotion's timeline. Inside the sequence, `frame` is
 * relative to the overlay's start (0..durationInFrames).
 */
export const OverlayItem: React.FC<{ overlay: Overlay }> = ({ overlay }) => {
  return (
    <Sequence
      from={overlay.startFrame}
      durationInFrames={overlay.durationInFrames}
      layout="none"
      name={`${overlay.type}:${overlay.id}`}
    >
      <OverlayBody overlay={overlay} />
    </Sequence>
  );
};

const OverlayBody: React.FC<{ overlay: Overlay }> = ({ overlay }) => {
  const frame = useCurrentFrame();
  const fade = computeFade(
    frame,
    overlay.durationInFrames,
    overlay.fadeInFrames,
    overlay.fadeOutFrames,
  );

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: overlay.x,
    top: overlay.y,
    width: overlay.width,
    height: overlay.height,
    transform: `rotate(${overlay.rotation}deg)`,
    transformOrigin: "center center",
    opacity: overlay.opacity * fade,
  };

  return (
    <AbsoluteFill>
      <div style={wrapperStyle}>{renderInner(overlay)}</div>
    </AbsoluteFill>
  );
};

/** Linear fade-in/out multiplier in [0,1] based on position within sequence. */
function computeFade(
  frame: number,
  duration: number,
  fadeIn: number,
  fadeOut: number,
): number {
  let factor = 1;
  if (fadeIn > 0) {
    factor *= interpolate(frame, [0, fadeIn], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (fadeOut > 0) {
    factor *= interpolate(
      frame,
      [duration - fadeOut, duration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  }
  return factor;
}

function renderInner(overlay: Overlay): React.ReactNode {
  switch (overlay.type) {
    case "text":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent:
              overlay.textAlign === "left"
                ? "flex-start"
                : overlay.textAlign === "right"
                  ? "flex-end"
                  : "center",
            color: overlay.color,
            backgroundColor: overlay.backgroundColor,
            fontSize: overlay.fontSize,
            fontWeight: overlay.fontWeight,
            fontFamily: overlay.fontFamily,
            textAlign: overlay.textAlign,
            lineHeight: overlay.lineHeight,
            letterSpacing: overlay.letterSpacing,
            padding: overlay.padding,
            borderRadius: overlay.borderRadius,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxSizing: "border-box",
          }}
        >
          {overlay.text}
        </div>
      );

    case "image":
      return (
        <Img
          src={overlay.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: overlay.objectFit,
            borderRadius: overlay.borderRadius,
          }}
        />
      );

    case "shape": {
      if (overlay.shape === "line") {
        return (
          <div
            style={{
              width: "100%",
              height: Math.max(overlay.strokeWidth, 2),
              backgroundColor:
                overlay.stroke === "transparent"
                  ? overlay.fill
                  : overlay.stroke,
              alignSelf: "center",
            }}
          />
        );
      }
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: overlay.fill,
            border:
              overlay.strokeWidth > 0
                ? `${overlay.strokeWidth}px solid ${overlay.stroke}`
                : "none",
            borderRadius:
              overlay.shape === "ellipse" ? "50%" : overlay.borderRadius,
            boxSizing: "border-box",
          }}
        />
      );
    }

    default:
      return null;
  }
}
