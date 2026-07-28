export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="trace-rule w-24 mb-5" />
      <h3 className="font-display font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-ink-dim max-w-xs mb-4">{body}</p>
      {action}
    </div>
  );
}
