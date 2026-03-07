import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-32 rounded-none" />
        <Skeleton className="h-4 w-72 rounded-none" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border p-4">
            <Skeleton className="h-3 w-20 rounded-none mb-2" />
            <Skeleton className="h-7 w-16 rounded-none" />
          </div>
        ))}
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-none" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 rounded-none" />
                    <Skeleton className="h-4 w-40 rounded-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16 rounded-none" />
                    <Skeleton className="h-3 w-24 rounded-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Tokens */}
                <div className="text-right hidden sm:block space-y-1">
                  <Skeleton className="h-3 w-20 rounded-none" />
                  <Skeleton className="h-3 w-16 rounded-none" />
                </div>
                {/* Cost */}
                <Skeleton className="h-5 w-14 rounded-none" />
                {/* Status */}
                <Skeleton className="h-5 w-16 rounded-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
