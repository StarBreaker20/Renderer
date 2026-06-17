import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Project not found</h1>
      <p className="text-sm text-muted">
        This catalog item doesn’t exist or was deleted.
      </p>
      <Link href="/" className="btn-primary">
        ← Back to catalog
      </Link>
    </main>
  );
}
