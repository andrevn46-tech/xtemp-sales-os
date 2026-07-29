import { TierEditor } from "@/components/commission/tier-editor";
import { getCommissionTiers, getWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CommissionTiersPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase, slug);
  if (!workspace) notFound();

  const tiers = await getCommissionTiers(supabase, workspace.id);

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <Link href={`/${slug}/commission`} className="text-xs text-ink-dim hover:text-ink">
          ← Commission
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink mt-2">Commission rate table</h1>
        <p className="text-sm text-ink-dim mt-1">
          Whichever tier a deal&rsquo;s actual value falls into, that tier&rsquo;s rate applies to the
          whole deal — not stacked like a tax bracket. This table is specific to {workspace.name}.
          Update it whenever your commission plan changes; no code or redeploy needed.
        </p>
      </div>

      <TierEditor tiers={tiers} workspaceSlug={slug} tracksSaleType={workspace.tracks_sale_type} />
    </div>
  );
}
