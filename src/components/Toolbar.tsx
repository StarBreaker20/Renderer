"use client";

import { useRef } from "react";
import type { PlayerRef } from "@remotion/player";
import { useEditorStore } from "@/store/useEditorStore";
import { makeOverlay } from "@/lib/overlayFactory";

export function Toolbar({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const addOverlay = useEditorStore((s) => s.addOverlay);
  const logoInput = useRef<HTMLInputElement>(null);

  const add = (type: "text" | "shape") => {
    playerRef.current?.pause();
    addOverlay(type, project.width, project.height);
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    playerRef.current?.pause();
    const { currentFrame } = useEditorStore.getState();
    const overlay = makeOverlay("image", {
      startFrame: currentFrame,
      fps: project.fps,
      durationInFrames: project.durationInFrames,
      canvasWidth: project.width,
      canvasHeight: project.height,
    });
    if (overlay.type === "image") overlay.src = dataUrl;
    useEditorStore.setState((s) => ({
      overlays: [...s.overlays, overlay],
      selectedId: overlay.id,
    }));
    if (logoInput.current) logoInput.current.value = "";
  };

  return (
    <div>
      <h3 className="field-label">Add overlay</h3>
      <div className="grid grid-cols-1 gap-2">
        <button className="btn-ghost justify-start" onClick={() => add("text")}>
          <span className="text-base">T</span> Text
        </button>
        <button className="btn-ghost justify-start" onClick={() => add("shape")}>
          <span className="text-base">▢</span> Shape
        </button>
        <button
          className="btn-ghost justify-start"
          onClick={() => logoInput.current?.click()}
        >
          <span className="text-base">🖼</span> Logo / Image
        </button>
        <input
          ref={logoInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onLogo}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted">
        Tip: pause the video, pick a frame below, then add an overlay — it starts
        at that frame.
      </p>
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}
