"use client";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color = "hsl(var(--primary))",
}: Props) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1); // avoid division by zero
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const padding = 1;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((val - min) / range) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Area fill path (line path + close at bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`spark-grad-${data.join("-")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-grad-${data.join("-")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
