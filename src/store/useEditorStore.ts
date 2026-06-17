"use client";

import { create } from "zustand";
import type { Overlay, OverlayType, Project } from "@/lib/types";
import { makeOverlay } from "@/lib/overlayFactory";

type SaveState = "idle" | "saving" | "saved" | "error";

type EditorState = {
  project: Project;
  overlays: Overlay[];
  selectedId: string | null;
  currentFrame: number;
  isPlaying: boolean;
  saveState: SaveState;

  // selection + playhead
  select: (id: string | null) => void;
  setCurrentFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;

  // overlay CRUD
  addOverlay: (type: OverlayType, canvasW: number, canvasH: number) => string;
  updateOverlay: (id: string, patch: Partial<Overlay>) => void;
  removeOverlay: (id: string) => void;
  duplicateOverlay: (id: string) => void;
  reorderOverlay: (id: string, direction: "up" | "down") => void;

  // project-level
  setBackgroundColor: (color: string) => void;
  setName: (name: string) => void;

  // persistence
  setSaveState: (s: SaveState) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  project: undefined as unknown as Project, // set via initEditorStore before use
  overlays: [],
  selectedId: null,
  currentFrame: 0,
  isPlaying: false,
  saveState: "idle",

  select: (id) => set({ selectedId: id }),
  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, Math.round(frame)) }),
  setPlaying: (playing) => set({ isPlaying: playing }),

  addOverlay: (type, canvasW, canvasH) => {
    const { project, currentFrame } = get();
    const overlay = makeOverlay(type, {
      startFrame: currentFrame,
      fps: project.fps,
      durationInFrames: project.durationInFrames,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
    });
    set((s) => ({ overlays: [...s.overlays, overlay], selectedId: overlay.id }));
    return overlay.id;
  },

  updateOverlay: (id, patch) =>
    set((s) => ({
      overlays: s.overlays.map((o) =>
        o.id === id ? ({ ...o, ...patch } as Overlay) : o,
      ),
    })),

  removeOverlay: (id) =>
    set((s) => ({
      overlays: s.overlays.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  duplicateOverlay: (id) =>
    set((s) => {
      const src = s.overlays.find((o) => o.id === id);
      if (!src) return s;
      const copy: Overlay = {
        ...src,
        id: `${src.type}_${Math.random().toString(36).slice(2, 9)}`,
        x: src.x + 24,
        y: src.y + 24,
      };
      return { overlays: [...s.overlays, copy], selectedId: copy.id };
    }),

  reorderOverlay: (id, direction) =>
    set((s) => {
      const idx = s.overlays.findIndex((o) => o.id === id);
      if (idx < 0) return s;
      const target = direction === "up" ? idx + 1 : idx - 1; // up = later = on top
      if (target < 0 || target >= s.overlays.length) return s;
      const next = [...s.overlays];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { overlays: next };
    }),

  setBackgroundColor: (color) =>
    set((s) => ({ project: { ...s.project, backgroundColor: color } })),

  setName: (name) => set((s) => ({ project: { ...s.project, name } })),

  setSaveState: (saveState) => set({ saveState }),
}));

/** Hydrate the store from a server-loaded project (call once on mount). */
export function initEditorStore(project: Project) {
  useEditorStore.setState({
    project,
    overlays: project.overlays,
    selectedId: null,
    currentFrame: 0,
    isPlaying: false,
    saveState: "idle",
  });
}

/** Convenience selector for the currently selected overlay. */
export function useSelectedOverlay(): Overlay | null {
  return useEditorStore((s) => s.overlays.find((o) => o.id === s.selectedId) ?? null);
}
