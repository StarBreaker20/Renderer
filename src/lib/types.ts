import { z } from "zod";

/**
 * Shared data model for the whole platform.
 *
 * These schemas are the single source of truth shared by three layers:
 *   1. The editor UI (creates/updates overlays).
 *   2. The Remotion composition (renders overlays deterministically).
 *   3. The render API + Lambda (validates inputProps before rendering).
 *
 * Everything is expressed in *composition pixel coordinates* (the video's
 * intrinsic width/height). The editor canvas scales these to screen space, so
 * a preview at any size renders identically to the final Lambda output —
 * that's what makes the export deterministic.
 */

// ---------------------------------------------------------------------------
// Overlay primitives
// ---------------------------------------------------------------------------

export const OVERLAY_TYPES = ["text", "image", "shape"] as const;

/** Common geometry + timing every overlay shares. */
const overlayBaseSchema = z.object({
  id: z.string(),
  /** First frame (inclusive) the overlay is visible. */
  startFrame: z.number().int().min(0),
  /** Number of frames the overlay stays visible. */
  durationInFrames: z.number().int().min(1),
  /** Top-left position in composition pixels. */
  x: z.number(),
  y: z.number(),
  width: z.number().min(1),
  height: z.number().min(1),
  /** Clockwise rotation in degrees. */
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  /** Fade-in / fade-out length in frames (0 = hard cut). */
  fadeInFrames: z.number().int().min(0).default(0),
  fadeOutFrames: z.number().int().min(0).default(0),
});

export const textOverlaySchema = overlayBaseSchema.extend({
  type: z.literal("text"),
  text: z.string().default("New text"),
  color: z.string().default("#ffffff"),
  backgroundColor: z.string().default("transparent"),
  fontSize: z.number().min(1).default(64),
  fontWeight: z.number().min(100).max(900).default(700),
  fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  lineHeight: z.number().min(0.5).max(3).default(1.2),
  letterSpacing: z.number().default(0),
  padding: z.number().min(0).default(8),
  borderRadius: z.number().min(0).default(0),
});

export const imageOverlaySchema = overlayBaseSchema.extend({
  type: z.literal("image"),
  /** Publicly reachable URL or data URL. Must be public for Lambda renders. */
  src: z.string(),
  objectFit: z.enum(["contain", "cover", "fill"]).default("contain"),
  borderRadius: z.number().min(0).default(0),
});

export const shapeOverlaySchema = overlayBaseSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rectangle", "ellipse", "line"]).default("rectangle"),
  fill: z.string().default("#6d8bff"),
  stroke: z.string().default("transparent"),
  strokeWidth: z.number().min(0).default(0),
  borderRadius: z.number().min(0).default(0),
});

export const overlaySchema = z.discriminatedUnion("type", [
  textOverlaySchema,
  imageOverlaySchema,
  shapeOverlaySchema,
]);

export type Overlay = z.infer<typeof overlaySchema>;
export type TextOverlay = z.infer<typeof textOverlaySchema>;
export type ImageOverlay = z.infer<typeof imageOverlaySchema>;
export type ShapeOverlay = z.infer<typeof shapeOverlaySchema>;
export type OverlayType = (typeof OVERLAY_TYPES)[number];

// ---------------------------------------------------------------------------
// Composition input props (what Remotion + Lambda receive)
// ---------------------------------------------------------------------------

export const videoEditorPropsSchema = z.object({
  /** Source video URL. Must be public (https / S3) for Lambda renders. */
  src: z.string(),
  overlays: z.array(overlaySchema).default([]),
  /** Background shown where the video doesn't cover (letterboxing). */
  backgroundColor: z.string().default("#000000"),
  // Render metadata. Optional in the schema (the studio falls back to
  // defaults), but always supplied for Lambda renders so calculateMetadata can
  // size the composition to the project's real dimensions/duration.
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  fps: z.number().min(1).optional(),
  durationInFrames: z.number().int().min(1).optional(),
});

export type VideoEditorProps = z.infer<typeof videoEditorPropsSchema>;

// ---------------------------------------------------------------------------
// Project (a catalog item)
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** URL the editor/player loads (local /uploads/.. in dev). */
  src: z.string(),
  /**
   * Public URL usable by Lambda. Often identical to `src` once the asset is on
   * S3/CDN; in local dev it stays null and export is disabled until provided.
   */
  publicSrc: z.string().nullable().default(null),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  fps: z.number().min(1),
  durationInFrames: z.number().int().min(1),
  backgroundColor: z.string().default("#000000"),
  overlays: z.array(overlaySchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

/** Compute the Remotion inputProps for a project (used for Lambda renders). */
export function projectToInputProps(project: Project): VideoEditorProps {
  return {
    src: project.publicSrc ?? project.src,
    overlays: project.overlays,
    backgroundColor: project.backgroundColor,
    width: project.width,
    height: project.height,
    fps: project.fps,
    durationInFrames: project.durationInFrames,
  };
}
