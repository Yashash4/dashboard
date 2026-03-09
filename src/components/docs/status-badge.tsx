export function StatusBadge({ code }: { code: number }) {
  const color =
    code < 300
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : code < 500
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30";
  return (
    <span
      className={`inline-flex px-2 py-0.5 font-mono text-[11px] font-bold border ${color}`}
    >
      {code}
    </span>
  );
}
