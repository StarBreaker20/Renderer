import { promises as fs } from "node:fs";
import path from "node:path";
import { projectSchema, type Project } from "./types";

/**
 * Minimal file-backed project store. Projects live as one JSON file each under
 * /data/projects. This keeps the demo zero-infra; swap these four functions for
 * a real DB (Postgres/Prisma) without touching the rest of the app.
 */

const DATA_DIR = path.join(process.cwd(), "data", "projects");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(id: string) {
  // Guard against path traversal from a malicious id.
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function listProjects(): Promise<Project[]> {
  await ensureDir();
  const entries = await fs.readdir(DATA_DIR);
  const projects: Project[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, entry), "utf-8");
      projects.push(projectSchema.parse(JSON.parse(raw)));
    } catch {
      // Skip corrupt/old-shape files rather than crashing the catalog.
    }
  }
  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(id: string): Promise<Project | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(fileFor(id), "utf-8");
    return projectSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveProject(project: Project): Promise<Project> {
  await ensureDir();
  const validated = projectSchema.parse({
    ...project,
    updatedAt: new Date().toISOString(),
  });
  await fs.writeFile(fileFor(validated.id), JSON.stringify(validated, null, 2));
  return validated;
}

export async function deleteProject(id: string): Promise<void> {
  await ensureDir();
  try {
    await fs.unlink(fileFor(id));
  } catch {
    // already gone
  }
}
