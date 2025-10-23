import React from "react";

interface Props {
  values: number[];
  labels: string[];
}

export const RadarChart: React.FC<Props> = ({ values, labels }) => {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;
  const points = values.map((v, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / labels.length;
    const r = (v / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const path = points.map((p) => p.join(",")).join(" ");

  return (
    <svg width={size} height={size} className="bg-white shadow rounded-2xl p-2">
      <polygon points={path} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth={2} />
      {labels.map((lb, i) => {
        const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / labels.length;
        const lx = cx + (radius + 16) * Math.cos(ang);
        const ly = cy + (radius + 16) * Math.sin(ang);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-xs">
            {lb}
          </text>
        );
      })}
    </svg>
  );
};
