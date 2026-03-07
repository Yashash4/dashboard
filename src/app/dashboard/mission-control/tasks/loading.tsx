import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-36 rounded-none" />
        <Skeleton className="h-4 w-72 rounded-none" />
      </div>

      {/* 5 Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, colIdx) => {
          const cardCounts = [2, 3, 4, 2, 1];
          return (
            <div key={colIdx} className="flex-shrink-0 w-[300px]">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 rounded-none" />
                  <Skeleton className="h-5 w-6 rounded-none" />
                </div>
              </div>

              {/* Column Body */}
              <div className="space-y-2 min-h-[200px] p-2 border border-border/50 border-t-2 border-t-muted-foreground/20">
                {Array.from({ length: cardCounts[colIdx] }).map((_, cardIdx) => (
                  <div key={cardIdx} className="border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-36 rounded-none" />
                      <Skeleton className="h-5 w-14 rounded-none" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded-none" />
                        <Skeleton className="h-3 w-20 rounded-none" />
                      </div>
                      <Skeleton className="h-3 w-14 rounded-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
