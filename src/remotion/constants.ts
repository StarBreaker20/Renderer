/** The single composition id used by the player, studio, and Lambda render. */
export const COMPOSITION_ID = "VideoEditor";

/**
 * Fallback dimensions used by the Remotion Studio preview only. At render time
 * the real width/height/fps/duration come from the project metadata via
 * calculateMetadata, so these don't affect production output.
 */
export const STUDIO_DEFAULTS = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
} as const;
