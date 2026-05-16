"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AttendanceChart() {
  const { logs } = useSelector((state: RootState) => state.attendance);

  // Group logs by hour and count
  const chartData = useMemo(() => {
    // Initialize hours from 08:00 to 18:00
    const hoursMap: Record<string, number> = {};
    for (let i = 8; i <= 18; i++) {
      const hourStr = `${i.toString().padStart(2, "0")}:00`;
      hoursMap[hourStr] = 0;
    }

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const hour = date.getHours();
      
      // We only care about hours between 8 AM and 6 PM
      if (hour >= 8 && hour <= 18) {
        const hourStr = `${hour.toString().padStart(2, "0")}:00`;
        hoursMap[hourStr]++;
      }
    });

    // Convert map to array for Recharts
    return Object.entries(hoursMap)
      .map(([time, count]) => ({ time, attendance: count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [logs]);

  return (
    <ResponsiveContainer width="100%" height="100%" className="-ml-6">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.3} />
        <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff", borderRadius: "8px" }}
          itemStyle={{ color: "#fff" }}
        />
        <Line 
          type="monotone" 
          dataKey="attendance" 
          stroke="#2563eb" 
          strokeWidth={3} 
          dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }} 
          activeDot={{ r: 6 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
