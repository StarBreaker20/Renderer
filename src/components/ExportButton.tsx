"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "rendering"; progress: number; renderId: string; bucketName: string }
  | { kind: "done"; url: string }
  | { kind: "error"; message: string };

export function ExportButton({ lambdaConfigured }: { lambdaConfigured: boolean }) {
  const projectId = useEditorStore((s) => s.project.id);
  const saveState = useEditorStore((s) => s.saveState);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  const start = async () => {
    setPhase({ kind: "starting" });
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Render failed to start");

      const { renderId, bucketName } = data;
      setPhase({ kind: "rendering", progress: 0, renderId, bucketName });

      poll.current = setInterval(async () => {
        const p = await fetch(
          `/api/render?renderId=${renderId}&bucketName=${bucketName}`,
        ).then((r) => r.json());
        if (p.status === "done") {
          if (poll.current) clearInterval(poll.current);
          setPhase({ kind: "done", url: p.url });
        } else if (p.status === "error") {
          if (poll.current) clearInterval(poll.current);
          setPhase({ kind: "error", message: p.error ?? "Render failed" });
        } else {
          setPhase({ kind: "rendering", progress: p.progress ?? 0, renderId, bucketName });
        }
      }, 1500);
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Render failed" });
    }
  };

  if (!lambdaConfigured) {
    return (
      <div className="panel-card p-3">
        <button className="btn-primary w-full" disabled title="Configure Lambda to enable export">
          Export MP4
        </button>
        <p className="mt-2 text-[11px] leading-snug text-muted">
          Export needs Remotion Lambda. Run <code className="text-gray-300">npm run remotion:deploy</code>{" "}
          and set the printed env vars (see README › Export).
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card p-3">
      {phase.kind === "done" ? (
        <a className="btn-primary w-full" href={phase.url} target="_blank" rel="noreferrer">
          ⬇ Download MP4
        </a>
      ) : (
        <button
          className="btn-primary w-full"
          onClick={start}
          disabled={phase.kind === "starting" || phase.kind === "rendering" || saveState === "saving"}
        >
          {phase.kind === "starting"
            ? "Starting…"
            : phase.kind === "rendering"
              ? `Rendering ${Math.round(phase.progress * 100)}%`
              : "Export MP4"}
        </button>
      )}

      {phase.kind === "rendering" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-edge">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.round(phase.progress * 100)}%` }}
          />
        </div>
      )}
      {phase.kind === "done" && (
        <button className="mt-2 w-full text-[11px] text-muted hover:text-gray-100" onClick={() => setPhase({ kind: "idle" })}>
          Render again
        </button>
      )}
      {phase.kind === "error" && (
        <p className="mt-2 text-[11px] leading-snug text-red-400">{phase.message}</p>
      )}
    </div>
  );
}
