import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { getOpenDeals } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatZAR } from "@/lib/utils";

export default async function PipelinePage() {
  const supabase = await createClient();
  const deals = await getOpenDeals(supabase);
  const totalValue = deals.reduce((s, d) => s + (d.estimated_value_zar ?? 0), 0);
  const weightedValue = deals.reduce(
    (s, d) => s + ((d.estimated_value_zar ?? 0) * d.probability) / 100,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Pipeline</h1>
          <p className="text-sm text-ink-dim mt-0.5">
            Drag a card to move it. Won and Lost are closed from the deal page, not dragged here.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-dim">Open value</p>
            <p className="font-mono text-lg font-semibold text-ink">{formatZAR(totalValue)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-dim">Weighted</p>
            <p className="font-mono text-lg font-semibold text-ink">{formatZAR(weightedValue)}</p>
          </div>
        </div>
      </div>

      <KanbanBoard deals={deals} />
    </div>
  );
}
