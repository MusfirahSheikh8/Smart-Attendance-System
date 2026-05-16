"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchLogs, fetchStats } from "@/store/attendanceSlice";
import StatsCards from "@/components/dashboard/StatsCards";
import AttendanceLogs from "@/components/dashboard/AttendanceLogs";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import { Clock } from "lucide-react";

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initial fetch
    dispatch(fetchLogs());
    dispatch(fetchStats());

    // Setup polling every 4 seconds
    const interval = setInterval(() => {
      dispatch(fetchLogs());
      dispatch(fetchStats());
    }, 4000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-zinc-50">Admin Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Overview of today's attendance logs and system health.
          </p>
        </div>
        <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-medium shadow hover:bg-zinc-800 transition">
          Export Report
        </button>
      </div>

      <StatsCards />

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-96">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          Attendance Rate (Today)
        </h3>
        <AttendanceChart />
      </div>

      <AttendanceLogs />
    </div>
  );
}