export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-zinc-200" />
      <div className="h-4 w-80 rounded bg-zinc-200/70" />
      <div className="h-48 rounded-2xl bg-white ring-1 ring-zinc-200" />
      <div className="h-64 rounded-2xl bg-white ring-1 ring-zinc-200" />
    </div>
  );
}
