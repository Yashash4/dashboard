import { Skeleton } from "@/components/ui/skeleton";

export default function MissionControlLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-52 rounded-none" />
        <Skeleton className="h-4 w-80 rounded-none" />
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-20 rounded-none" />
              <Skeleton className="h-4 w-4 rounded-none" />
            </div>
            <Skeleton className="h-7 w-16 rounded-none" />
          </div>
        ))}
      </div>

      {/* 2-col: Agent Roster + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Roster Mini */}
        <div className="border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-none" />
              </div>
              <Skeleton className="h-5 w-16 rounded-none" />
            </div>
          ))}
        </div>

        {/* Recent Events Mini */}
        <div className="border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-none" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full rounded-none" />
                <Skeleton className="h-3 w-32 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col: Tasks In Progress + Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-none" />
            <Skeleton className="h-4 w-20 rounded-none" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-40 rounded-none" />
              </div>
              <Skeleton className="h-3 w-20 rounded-none" />
            </div>
          ))}
        </div>

        <div className="border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-none" />
                <Skeleton className="h-4 w-24 rounded-none" />
                <Skeleton className="h-3 w-32 rounded-none" />
              </div>
              <Skeleton className="h-3 w-24 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
