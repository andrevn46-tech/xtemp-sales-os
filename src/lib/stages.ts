import { WON, LOST } from "./types";
import type { NextActionType, PipelineStage } from "./types";

export interface StageMeta {
  label: string;
  color: "wire" | "amber" | "signal" | "alert";
}

const TERMINAL_META: Record<string, StageMeta> = {
  [WON]: { label: "Won", color: "signal" },
  [LOST]: { label: "Lost", color: "alert" },
};

/** Resolves a deal's stage to a label + color, whether it's an open
 *  (workspace-specific) stage or the universal won/lost. */
export function getStageMeta(stage: string, stages: PipelineStage[]): StageMeta {
  if (TERMINAL_META[stage]) return TERMINAL_META[stage];
  const match = stages.find((s) => s.key === stage);
  if (match) return { label: match.label, color: match.color };
  // Fallback for a stage key that no longer exists in the table (e.g. it was
  // renamed) — still render something readable instead of breaking.
  return { label: stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, " "), color: "wire" };
}

export function isTerminalStage(stage: string): boolean {
  return stage === WON || stage === LOST;
}

/** Ordered list of the open (kanban) stage keys for a workspace, plus a
 *  lookup map — sourced from the pipeline_stages table, not hardcoded. */
export function sortStages(stages: PipelineStage[]): PipelineStage[] {
  return [...stages].sort((a, b) => a.sort_order - b.sort_order);
}

export function suggestedFollowUpForStage(
  stage: string,
  stages: PipelineStage[]
): { type: NextActionType; date: string } {
  const match = stages.find((s) => s.key === stage);
  const days = match?.default_followup_days ?? 3;
  const type = match?.default_followup_type ?? "call";
  const d = new Date();
  d.setDate(d.getDate() + days);
  return { type, date: d.toISOString().slice(0, 10) };
}
