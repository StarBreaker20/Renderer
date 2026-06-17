import Link from "next/link";
import { listProjects } from "@/lib/storage";
import { UploadButton } from "@/components/UploadButton";
import { ProjectCard } from "@/components/ProjectCard";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const projects = await listProjects();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-accent">Renderer</span> Catalog
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Upload a video, pause it into frames, then edit text, logos, shapes,
            colors and positions. Export a deterministic MP4 with Remotion.
          </p>
        </div>
        <UploadButton />
      </header>

      {projects.length === 0 ? (
        <div className="panel-card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="text-5xl">🎬</div>
          <h2 className="text-lg font-medium">Your catalog is empty</h2>
          <p className="max-w-sm text-sm text-muted">
            Upload your first video to start editing frames. MP4, WebM and MOV
            are supported.
          </p>
          <UploadButton />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/editor/${p.id}`} className="block">
                <ProjectCard project={p} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
