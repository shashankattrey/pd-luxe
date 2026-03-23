"use client";
// All Recharts imports MUST stay inside this file only
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function PieChartClient({ data }: { data: any[] }) {
  const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          outerRadius={80}
          innerRadius={50}
          paddingAngle={5}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#09090b",
            border: "1px solid #27272a",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
