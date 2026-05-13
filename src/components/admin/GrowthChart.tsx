"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GrowthChartProps {
  data: { month: string; total: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 13 }}
          formatter={(value) => [value ?? 0, "Acteurs"]}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#665DFF"
          strokeWidth={2}
          dot={{ r: 3, fill: "#665DFF", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#665DFF", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
