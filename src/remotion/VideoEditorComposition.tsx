import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { videoEditorPropsSchema, type VideoEditorProps } from "@/lib/types";
import { OverlayItem } from "./overlays/OverlayItem";

/**
 * The deterministic composition. Layer order:
 *   1. background color (letterboxing)
 *   2. the source video (OffthreadVideo = frame-accurate, used for renders)
 *   3. overlays, in array order (later = on top)
 *
 * The exact same component renders in the browser <Player>, the Remotion
 * Studio, and on Lambda — guaranteeing the preview matches the export.
 */
export const VideoEditorComposition: React.FC<VideoEditorProps> = (props) => {
  // Parse to apply schema defaults even if a caller passed a partial object.
  const { src, overlays, backgroundColor } = videoEditorPropsSchema.parse(props);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {src ? (
        <OffthreadVideo src={src} pauseWhenBuffering toneMapped={false} />
      ) : null}
      {overlays.map((overlay) => (
        <OverlayItem key={overlay.id} overlay={overlay} />
      ))}
    </AbsoluteFill>
  );
};
