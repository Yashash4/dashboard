import { AlertTriangle, Info, Zap } from "lucide-react";

export function Callout({
  type,
  children,
}: {
  type: "warning" | "info" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    warning: "border-amber-500 bg-amber-500/5",
    info: "border-blue-500 bg-blue-500/5",
    tip: "border-emerald-500 bg-emerald-500/5",
  };
  const icons = {
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
    tip: <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`border-l-2 ${styles[type]} p-4 flex gap-3`}>
      {icons[type]}
      <div className="text-[13px] text-white/70 leading-relaxed">{children}</div>
    </div>
  );
}
