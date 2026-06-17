import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/storage";
import { isLambdaConfigured } from "@/lib/lambda";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <nav className="flex h-12 shrink-0 items-center gap-3 border-b border-edge bg-panel px-4">
        <Link href="/" className="text-sm text-muted hover:text-gray-100">
          ← Catalog
        </Link>
        <span className="text-edge">/</span>
        <span className="text-sm font-medium">{project.name}</span>
      </nav>
      <Editor project={project} lambdaConfigured={isLambdaConfigured()} />
    </div>
  );
}
