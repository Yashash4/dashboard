import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-none" />
        <Skeleton className="h-4 w-72 rounded-none" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border p-4 space-y-3">
            <Skeleton className="h-4 w-24 rounded-none" />
            <Skeleton className="h-8 w-16 rounded-none" />
            <Skeleton className="h-3 w-32 rounded-none" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-36 rounded-none" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
