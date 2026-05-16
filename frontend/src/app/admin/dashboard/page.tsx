"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter } from "next/navigation";
import { fetchLogs, fetchStats } from "@/store/attendanceSlice";
import StatsCards from "@/components/dashboard/StatsCards";
import AttendanceLogs from "@/components/dashboard/AttendanceLogs";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import { Clock } from "lucide-react";

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { logs, stats, loading } = useSelector((state: RootState) => state.attendance);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    // Initial fetch
    dispatch(fetchLogs());
    dispatch(fetchStats());

    // Setup polling every 2 seconds for real-time feel
    const interval = setInterval(() => {
      dispatch(fetchLogs()).then((res) => {
        if (res.payload === 'SESSION_EXPIRED') router.push('/auth/login');
      });
      dispatch(fetchStats()).then((res) => {
        if (res.payload === 'SESSION_EXPIRED') router.push('/auth/login');
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, role, router]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold dark:text-zinc-50">Admin Dashboard</h1>
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Overview of today's attendance logs and system health.
          </p>
        </div>
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
