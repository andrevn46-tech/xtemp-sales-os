import { StageEditor } from "@/components/pipeline/stage-editor";
import { getPipelineStages, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PipelineStagesPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const stages = await getPipelineStages(supabase, workspace.id);

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <Link href={`/${slug}/pipeline`} className="text-xs text-ink-dim hover:text-ink">
          ← Pipeline
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink mt-2">Pipeline stages</h1>
        <p className="text-sm text-ink-dim mt-1">
          These are the working stages for {workspace.name}&rsquo;s kanban board, in order. &ldquo;Won&rdquo; and
          &ldquo;Lost&rdquo; always exist automatically and aren&rsquo;t listed here — add, remove, or reorder
          anything in between. Each stage&rsquo;s default follow-up is what gets suggested when a deal enters it.
        </p>
      </div>

      <StageEditor stages={stages} workspaceSlug={slug} />
    </div>
  );
}
