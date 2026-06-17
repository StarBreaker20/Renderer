import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject, deleteProject } from "@/lib/storage";
import { projectSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

/** Partial update — overlays, name, backgroundColor, publicSrc, fps. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await getProject(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  // Re-derive durationInFrames if fps changes so frame timing stays correct.
  const fps = typeof body.fps === "number" ? body.fps : existing.fps;
  const durationSeconds = existing.durationInFrames / existing.fps;

  const merged = projectSchema.parse({
    ...existing,
    name: body.name ?? existing.name,
    overlays: body.overlays ?? existing.overlays,
    backgroundColor: body.backgroundColor ?? existing.backgroundColor,
    publicSrc:
      body.publicSrc !== undefined ? body.publicSrc : existing.publicSrc,
    fps,
    durationInFrames:
      fps !== existing.fps
        ? Math.max(1, Math.round(durationSeconds * fps))
        : existing.durationInFrames,
  });

  const saved = await saveProject(merged);
  return NextResponse.json({ project: saved });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
