export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading analytics">
      <div className="h-8 w-48 rounded-lg bg-zinc-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white ring-1 ring-zinc-200" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white ring-1 ring-zinc-200" />
    </div>
  );
}
