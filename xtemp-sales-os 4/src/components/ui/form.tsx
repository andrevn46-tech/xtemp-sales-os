import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-dim">
        {label}
        {required && <span className="text-alert"> *</span>}
      </label>
      {children}
      {hint && <span className="text-[11px] text-ink-dim">{hint}</span>}
    </div>
  );
}

const controlBase =
  "w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-wire transition-colors";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, "min-h-[90px] resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlBase, "appearance-none", className)} {...props} />;
}
