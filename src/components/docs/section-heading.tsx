export function SectionHeading({
  num,
  title,
  id,
}: {
  num: string;
  title: string;
  id: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="font-mono text-[10px] text-primary/50 tracking-widest">
        {num}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
      <h2 id={`heading-${id}`} className="text-2xl font-bold text-white tracking-tight">
        {title}
      </h2>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}
