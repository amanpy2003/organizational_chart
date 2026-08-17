export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
