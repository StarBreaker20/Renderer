import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { listProjects, saveProject } from "@/lib/storage";
import { createId } from "@/lib/id";
import { projectSchema } from "@/lib/types";

export const runtime = "nodejs";
// Allow large video uploads through the route handler.
export const maxDuration = 300;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

/**
 * Multipart upload: creates a project from an uploaded video file plus the
 * metadata the client probed (dimensions + duration) from the file locally.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const name = String(form.get("name") ?? "Untitled");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const durationSeconds = Number(form.get("durationSeconds"));
  const fps = Number(form.get("fps") ?? 30);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!width || !height || !durationSeconds) {
    return NextResponse.json(
      { error: "Missing video metadata (width/height/duration)" },
      { status: 400 },
    );
  }

  const id = createId("vid");
  const ext = extFor(file.name, file.type);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${id}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  const localSrc = `/uploads/${fileName}`;
  // If a public base URL is configured (CDN/tunnel), Lambda can reach the asset.
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const publicSrc = base ? `${base}${localSrc}` : null;

  const now = new Date().toISOString();
  const project = projectSchema.parse({
    id,
    name,
    src: localSrc,
    publicSrc,
    width: Math.round(width),
    height: Math.round(height),
    fps,
    durationInFrames: Math.max(1, Math.round(durationSeconds * fps)),
    backgroundColor: "#000000",
    overlays: [],
    createdAt: now,
    updatedAt: now,
  });

  await saveProject(project);
  return NextResponse.json({ project }, { status: 201 });
}

function extFor(fileName: string, mime: string): string {
  const fromName = path.extname(fileName).toLowerCase();
  if (fromName) return fromName;
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("quicktime")) return ".mov";
  return ".mp4";
}
