import { Sidebar } from "@/components/layout/sidebar";
import { getWorkspaces, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const supabase = await createClient();

  const [workspace, workspaces, userResult] = await Promise.all([
    getWorkspace(supabase, slug),
    getWorkspaces(supabase),
    supabase.auth.getUser(),
  ]);

  if (!workspace) notFound();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
        userEmail={userResult.data.user?.email ?? null}
        workspaces={workspaces}
        currentSlug={slug}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
