import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-36 rounded-none" />
        <Skeleton className="h-4 w-72 rounded-none" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-8 w-24 rounded-none" />
        <Skeleton className="h-8 w-28 rounded-none" />
        <Skeleton className="h-4 w-20 rounded-none ml-auto" />
      </div>

      {/* Event List */}
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border border-border p-3">
            <div className="flex items-center gap-3">
              {/* Timestamp */}
              <Skeleton className="h-3 w-14 rounded-none shrink-0" />
              {/* Severity icon */}
              <Skeleton className="h-6 w-6 rounded-none shrink-0" />
              {/* Type badge */}
              <Skeleton className="h-5 w-16 rounded-none shrink-0" />
              {/* Message */}
              <Skeleton className="h-4 flex-1 rounded-none" />
              {/* Agent name */}
              <Skeleton className="h-3 w-20 rounded-none shrink-0 hidden sm:block" />
              {/* Time ago */}
              <Skeleton className="h-3 w-12 rounded-none shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
