"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";

/**
 * Debounced autosave. Watches overlays + project name/background and PATCHes
 * the project ~800ms after the last change. Keeps the catalog and any future
 * render in sync without an explicit "Save" button.
 */
export function useAutosave(projectId: string) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prev) => {
      const changed =
        state.overlays !== prev.overlays ||
        state.project.name !== prev.project.name ||
        state.project.backgroundColor !== prev.project.backgroundColor;
      if (!changed) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const { overlays, project, setSaveState } = useEditorStore.getState();
        setSaveState("saving");
        try {
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              overlays,
              name: project.name,
              backgroundColor: project.backgroundColor,
            }),
          });
          setSaveState(res.ok ? "saved" : "error");
        } catch {
          setSaveState("error");
        }
      }, 800);
    });

    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId]);

  // Avoid flagging the initial hydration as a change.
  useEffect(() => {
    first.current = false;
  }, []);
}
