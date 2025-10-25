import React from "react";

interface Props {
  values: number[];
  labels: string[];
}

export const RadarChart: React.FC<Props> = ({ values, labels }) => {
  const size = 440; // ปรับขนาดให้เล็กลง
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.30; // ลดขนาดรัศมีลงเพื่อให้มีพื้นที่สำหรับ label มากขึ้น
  
  // Create points for the data polygon
  const points = values.map((v, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / labels.length;
    const r = (v / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const path = points.map((p) => p.join(",")).join(" ");

  // Create background grid with 5 levels
  const gridLevels = [20, 40, 60, 80, 100];
  const axes = labels.map((_, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / labels.length;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });

  return (
    <svg width={size} height={size} className="w-full h-full">
      {/* พื้นหลังสีขาว */}
      <rect width={size} height={size} fill="white" rx="8" />

      {/* วงกลมแสดงระดับ */}
      {gridLevels.map((level) => {
        const r = (level / 100) * radius;
        return (
          <circle
            key={level}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        );
      })}

      {/* เส้นแกนหลัก */}
      {axes.map((point, i) => (
        <line
          key={`axis-${i}`}
          x1={cx}
          y1={cy}
          x2={point[0]}
          y2={point[1]}
          stroke="#E2E8F0"
          strokeWidth={1}
        />
      ))}

      {/* ตัวเลขแสดงระดับ */}
      {gridLevels.map((level) => (
        <text
          key={`scale-${level}`}
          x={cx}
          y={cy - (level / 100) * radius}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-400"
          style={{ fontSize: '12px', fontFamily: 'Kanit, sans-serif' }}
        >
          {level}
        </text>
      ))}

      {/* พื้นที่ข้อมูล */}
      <polygon
        points={axes.map(p => p.join(",")).join(" ")}
        fill="rgba(241,245,249,0.5)"
        stroke="#E2E8F0"
        strokeWidth={1}
      />

      {/* กราฟข้อมูล */}
      <polygon
        points={path}
        fill="rgba(37, 99, 235, 0.15)"
        stroke="#2563EB"
        strokeWidth={2}
      />

      {/* เปอร์เซ็นต์ที่จุดข้อมูล */}
      {points.map((point, i) => (
        <text
          key={`value-${i}`}
          x={point[0]}
          y={point[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-blue-600 font-semibold"
          style={{ fontSize: '14px', fontFamily: 'Kanit, sans-serif' }}
        >
          {Math.round(values[i])}%
        </text>
      ))}

      {/* ป้ายชื่อ */}
      {labels.map((lb, i) => {
        const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / labels.length;
        const offset = 35; // เพิ่มระยะห่าง
        const lx = cx + (radius + offset) * Math.cos(ang);
        const ly = cy + (radius + offset) * Math.sin(ang);
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-700 font-medium"
            style={{ fontSize: '14px', fontFamily: 'Kanit, sans-serif' }}
          >
            {lb}
          </text>
        );
      })}
    </svg>
  );
};
