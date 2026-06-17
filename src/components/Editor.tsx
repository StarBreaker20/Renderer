"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import type { Project } from "@/lib/types";
import { initEditorStore, useEditorStore } from "@/store/useEditorStore";
import { PreviewStage } from "./PreviewStage";
import { Transport } from "./Transport";
import { Filmstrip } from "./Filmstrip";
import { Timeline } from "./Timeline";
import { LayersPanel } from "./LayersPanel";
import { Toolbar } from "./Toolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { ExportButton } from "./ExportButton";
import { useAutosave } from "./useAutosave";

export function Editor({
  project,
  lambdaConfigured,
}: {
  project: Project;
  lambdaConfigured: boolean;
}) {
  const playerRef = useRef<PlayerRef | null>(null);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // The editor relies on the browser-only Remotion Player/Thumbnail and a
  // global store, so we hydrate the store and mount the editor on the client
  // only. SSR would render against an empty store and the Player can't run on
  // the server anyway.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initEditorStore(project);
    setReady(true);
  }, [project]);

  useAutosave(project.id);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_300px] overflow-hidden">
      {/* Left: tools + layers */}
      <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-edge bg-panel p-3">
        <Toolbar playerRef={playerRef} />
        <LayersPanel playerRef={playerRef} />
        <div className="mt-auto">
          <ExportButton lambdaConfigured={lambdaConfigured} />
        </div>
      </aside>

      {/* Center: preview, transport, filmstrip, timeline */}
      <section className="flex min-h-0 flex-col overflow-hidden bg-ink">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
          <PreviewStage playerRef={playerRef} />
        </div>
        <Transport playerRef={playerRef} />
        {!isPlaying && <Filmstrip playerRef={playerRef} />}
        <Timeline playerRef={playerRef} />
      </section>

      {/* Right: properties */}
      <aside className="min-h-0 overflow-y-auto border-l border-edge bg-panel p-3">
        <PropertiesPanel />
      </aside>
    </div>
  );
}
