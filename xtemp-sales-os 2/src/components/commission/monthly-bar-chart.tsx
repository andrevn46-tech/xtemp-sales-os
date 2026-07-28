const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyBarChart({ values }: { values: number[] }) {
  const width = 720;
  const height = 180;
  const padding = 24;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding - 20;
  const max = Math.max(1, ...values);
  const barWidth = chartWidth / values.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Commission by month">
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={padding + chartHeight}
        stroke="var(--line)"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={padding + chartHeight}
        x2={width - padding}
        y2={padding + chartHeight}
        stroke="var(--line)"
        strokeWidth="1"
      />
      {values.map((v, i) => {
        const barHeight = max > 0 ? (v / max) * chartHeight : 0;
        const x = padding + i * barWidth + barWidth * 0.15;
        const y = padding + chartHeight - barHeight;
        const w = barWidth * 0.7;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={Math.max(barHeight, 1)} rx="2" fill="var(--signal)" opacity={v > 0 ? 1 : 0.15} />
            <text
              x={x + w / 2}
              y={padding + chartHeight + 14}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--ink-dim)"
            >
              {MONTH_LABELS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
