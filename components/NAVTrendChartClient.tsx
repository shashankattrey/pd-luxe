"use client";
import React, { useMemo } from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function NAVTrendChartClient({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    return [...data]
      .slice(0, 30)
      .reverse()
      .map((item) => ({
        date: item.date,
        nav: parseFloat(item.nav),
      }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            backgroundColor: "#09090b",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: "12px",
            fontSize: "10px",
          }}
          itemStyle={{ color: "#D4AF37" }}
        />
        <Area
          type="monotone"
          dataKey="nav"
          stroke="#D4AF37"
          fill="url(#navGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
