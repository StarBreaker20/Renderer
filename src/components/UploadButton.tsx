"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Picks a video file, probes its real dimensions + duration locally (via a
 * hidden <video>), then uploads file + metadata. We probe client-side so the
 * server doesn't need ffprobe — the browser already decoded the header.
 */
export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const meta = await probeVideo(file);
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("width", String(meta.width));
      form.append("height", String(meta.height));
      form.append("durationSeconds", String(meta.duration));
      form.append("fps", "30");

      const res = await fetch("/api/projects", { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error ?? "Upload failed");
      }
      const { project } = await res.json();
      router.push(`/editor/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFile}
      />
      <button className="btn-primary" onClick={onPick} disabled={busy}>
        {busy ? "Uploading…" : "＋ Upload video"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

function probeVideo(
  file: File,
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video;
      URL.revokeObjectURL(url);
      if (!videoWidth || !videoHeight || !isFinite(duration)) {
        reject(new Error("Could not read video metadata"));
        return;
      }
      resolve({ width: videoWidth, height: videoHeight, duration });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unsupported or corrupt video file"));
    };
    video.src = url;
  });
}
