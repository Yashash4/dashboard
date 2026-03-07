import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-40 rounded-none" />
        <Skeleton className="h-4 w-80 rounded-none" />
      </div>

      {/* 6 Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border p-3 flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <div>
              <Skeleton className="h-6 w-6 rounded-none mb-1" />
              <Skeleton className="h-2.5 w-12 rounded-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-none" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32 rounded-none" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-none" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded-none" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Capacity bar */}
                <div className="w-24 hidden sm:block space-y-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-2.5 w-14 rounded-none" />
                    <Skeleton className="h-2.5 w-8 rounded-none" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-none" />
                </div>
                {/* Performance */}
                <Skeleton className="h-3 w-10 rounded-none hidden md:block" />
                {/* Last active */}
                <Skeleton className="h-3 w-14 rounded-none hidden lg:block" />
                <Skeleton className="h-4 w-4 rounded-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
