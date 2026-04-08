export function LoadingDeck() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="w-full">
          <div className="mb-2 h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="aspect-video w-full animate-pulse rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-100 p-6" />
        </div>
      ))}
    </div>
  );
}
