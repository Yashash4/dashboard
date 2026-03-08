const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

export function HttpBadge({ method }: { method: string }) {
  const style = METHOD_STYLES[method] || METHOD_STYLES.GET;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider border ${style}`}
    >
      {method}
    </span>
  );
}
