import React from "react";
import { Composition } from "remotion";
import { videoEditorPropsSchema } from "@/lib/types";
import { COMPOSITION_ID, STUDIO_DEFAULTS } from "./constants";
import { VideoEditorComposition } from "./VideoEditorComposition";

/**
 * Registers the single composition. Real width/height/fps/duration are supplied
 * at render time through `defaultProps` overrides + the Lambda render call
 * (which pass the project's actual metadata). The values here are studio-only
 * fallbacks.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={COMPOSITION_ID}
      component={VideoEditorComposition}
      schema={videoEditorPropsSchema}
      width={STUDIO_DEFAULTS.width}
      height={STUDIO_DEFAULTS.height}
      fps={STUDIO_DEFAULTS.fps}
      durationInFrames={STUDIO_DEFAULTS.durationInFrames}
      defaultProps={{
        src: "",
        overlays: [],
        backgroundColor: "#000000",
      }}
      // Size the composition from the project metadata passed in inputProps,
      // so a single composition renders any video at its true resolution.
      calculateMetadata={({ props }) => ({
        width: props.width ?? STUDIO_DEFAULTS.width,
        height: props.height ?? STUDIO_DEFAULTS.height,
        fps: props.fps ?? STUDIO_DEFAULTS.fps,
        durationInFrames:
          props.durationInFrames ?? STUDIO_DEFAULTS.durationInFrames,
      })}
    />
  );
};
