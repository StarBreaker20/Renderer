"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { VideoEditorComposition } from "@/remotion/VideoEditorComposition";
import { useEditorStore } from "@/store/useEditorStore";
import { OverlayCanvas } from "./OverlayCanvas";

/**
 * Hosts the Remotion <Player> (built-in controls disabled — we drive transport
 * ourselves) and the interactive OverlayCanvas layered exactly on top of it.
 * The canvas is scaled from composition pixels to the on-screen player size so
 * what you drag is what gets rendered.
 */
export function PreviewStage({
  playerRef,
}: {
  playerRef: React.RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const overlays = useEditorStore((s) => s.overlays);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const select = useEditorStore((s) => s.select);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Fit the composition into the available area while preserving aspect ratio.
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = el;
      const aspect = project.width / project.height;
      let w = clientWidth;
      let h = w / aspect;
      if (h > clientHeight) {
        h = clientHeight;
        w = h * aspect;
      }
      setBox({ width: Math.floor(w), height: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [project.width, project.height]);

  // Sync the playhead + play state from the player into the store. The Player
  // only mounts once we have a measured box (box.width > 0), so gate the
  // listener wiring on that — otherwise this effect runs while playerRef is
  // still null and the play/pause/frame events never reach the store.
  const playerMounted = box.width > 0;
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) =>
      setCurrentFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
    };
  }, [playerRef, playerMounted, setCurrentFrame, setPlaying]);

  const inputProps = useMemo(
    () => ({
      src: project.src,
      overlays,
      backgroundColor: project.backgroundColor,
    }),
    [project.src, project.backgroundColor, overlays],
  );

  const scale = box.width > 0 ? box.width / project.width : 1;

  return (
    <div
      ref={wrapperRef}
      className="flex h-full w-full items-center justify-center"
    >
      {box.width > 0 && (
        <div
          className="relative shadow-2xl ring-1 ring-edge"
          style={{ width: box.width, height: box.height }}
          onPointerDown={(e) => {
            // Click on empty stage clears selection.
            if (e.target === e.currentTarget) select(null);
          }}
        >
          <Player
            ref={playerRef as React.Ref<PlayerRef>}
            component={VideoEditorComposition}
            inputProps={inputProps}
            durationInFrames={project.durationInFrames}
            fps={project.fps}
            compositionWidth={project.width}
            compositionHeight={project.height}
            style={{ width: box.width, height: box.height }}
            controls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            acknowledgeRemotionLicense
          />
          <OverlayCanvas scale={scale} />
        </div>
      )}
    </div>
  );
}
