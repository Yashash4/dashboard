interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="border border-white/10 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase tracking-wider">
              Parameter
            </th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase tracking-wider">
              Required
            </th>
            <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase tracking-wider">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-white/[0.06] last:border-0">
              <td className="px-4 py-3">
                <code className="font-mono text-[13px] text-white/90">{p.name}</code>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-[12px] text-amber-400/80">{p.type}</span>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="inline-flex px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
                    Required
                  </span>
                ) : (
                  <span className="inline-flex px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
                    Optional
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[13px] text-white/60">
                {p.description}
                {p.default && (
                  <span className="ml-2 text-white/30">
                    Default: <code className="font-mono text-white/50">{p.default}</code>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
