import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatZAR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(iso)} · ${d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days between an ISO date and today. Negative = overdue. */
export function daysFromToday(iso: string): number {
  const today = new Date(todayISODate() + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return daysFromToday(iso) < 0;
}

export function isDueToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return daysFromToday(iso) === 0;
}

export function relativeDayLabel(iso: string | null | undefined): string {
  if (!iso) return "No date set";
  const diff = daysFromToday(iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 7) return `In ${diff}d`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
