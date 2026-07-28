"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-ink text-paper font-medium hover:bg-panel-raised"
    >
      <Printer size={14} />
      Print / Save as PDF
    </button>
  );
}
