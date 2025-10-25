import React from "react";

interface Point { period: string; avg_fuel: number }
interface Props { 
  data: Point[]; 
  height?: number;
  mode?: "Day" | "Month" | "Year";  // Add mode prop
}

export const BarChart: React.FC<Props> = ({ data, height = 300, mode = "Day" }) => {
  if (!data || !data.length) return <div className="text-center text-gray-400">No data</div>;
  // dynamic width depending on number of bars so labels don't overlap
  const perBar = 60; // px per data point (slot)
  const minWidth = 800;
  const chartWidth = Math.max(minWidth, data.length * perBar);
  const margin = { top: 24, right: 12, bottom: 70, left: 84 } as const; // increased left margin for Y label spacing
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const rawMax = Math.max(...data.map(d => d.avg_fuel), 0.1);
  const max = rawMax * 1.15; // add 15% headroom so bars don't touch top
  const yTicks = 4;

  const formatX = (period: string) => {
    if (mode === "Day") {
      // Only add ":00" for Day mode when period is a number
      const isTimeFormat = /^\d{1,2}$/.test(period);
      if (isTimeFormat) {
        const hour = period.padStart(2, '0');
        return `${hour}:00`;
      }
    }
    // For Month/Year modes or non-numeric periods, return as is
    return period;
  }

  const barSlot = innerWidth / data.length;
  const barWidth = Math.max(12, barSlot * 0.7);
  const labelPosX = -margin.left + 12;
  const labelPosY = innerHeight / 2;

  return (
    <div style={{ minWidth: chartWidth }}>
      <svg width="100%" viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMinYMin">
        <g transform={`translate(${margin.left},${margin.top})`}>
        {/* horizontal grid and y labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const t = i / yTicks; // 0..1 from top
          const value = (1 - t) * max;
          const y = t * innerHeight;
          return (
            <g key={i}>
              <line x1={0} x2={innerWidth} y1={y} y2={y} stroke="#eef2ff" />
              <text x={-18} y={y + 4} fontSize={12} textAnchor="end" fill="#6b7280">{value.toFixed(1)}</text>
            </g>
          );
        })}

    {/* y axis unit label (vertical) */}
    <text transform={`translate(${labelPosX}, ${labelPosY}) rotate(-90)`} fontSize={12} textAnchor="middle" fill="#374151">L/100km</text>

        {/* bars */}
        {data.map((d, i) => {
          const x = i * barSlot + (barSlot - barWidth) / 2;
          const h = (d.avg_fuel / max) * innerHeight;
          const y = innerHeight - h;
          return (
            <g key={d.period}>
              <rect x={x} y={y} width={barWidth} height={h} rx={6} fill="#2563EB" />
              <text x={x + barWidth / 2} y={y - 6} fontSize={12} textAnchor="middle" fill="#1e40af">{d.avg_fuel.toFixed(1)}</text>
              {/* rotated X label to avoid overlap */}
              <text transform={`translate(${x + barWidth / 2}, ${innerHeight + 24}) rotate(-45)`} fontSize={11} textAnchor="end" fill="#374151">{formatX(d.period)}</text>
            </g>
          );
        })}
      </g>
    </svg>
    </div>
  );
};
