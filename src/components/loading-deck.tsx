export function LoadingDeck() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="w-full anim-reveal" data-delay={String(Math.min(idx + 1, 3))}>
          <div className="mb-2 flex items-center justify-between">
            <div className="skeleton-shimmer h-3 w-28 rounded" />
            <div className="skeleton-shimmer h-3 w-20 rounded" />
          </div>

          <div className="relative aspect-video overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
            <div className="skeleton-shimmer mt-5 h-6 w-72 rounded-lg" />
            <div className="skeleton-shimmer mt-4 h-4 w-full rounded" />
            <div className="skeleton-shimmer mt-3 h-4 w-[88%] rounded" />
            <div className="skeleton-shimmer mt-3 h-4 w-[74%] rounded" />
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="skeleton-shimmer h-24 rounded-xl" />
              <div className="skeleton-shimmer h-24 rounded-xl" />
              <div className="skeleton-shimmer h-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
