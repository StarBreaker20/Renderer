import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const seconds = Math.round(project.durationInFrames / project.fps);
  return (
    <div className="panel-card overflow-hidden transition-colors hover:border-accent">
      <div className="relative flex aspect-video items-center justify-center bg-black">
        {/* Use the raw video element as a lightweight poster. */}
        <video
          src={project.src}
          className="h-full w-full object-contain"
          muted
          preload="metadata"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs tabular-nums text-gray-200">
          {formatDuration(seconds)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{project.name}</p>
          <p className="text-xs text-muted">
            {project.width}×{project.height} · {project.fps}fps ·{" "}
            {project.overlays.length} edit
            {project.overlays.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-accent">Edit →</span>
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
