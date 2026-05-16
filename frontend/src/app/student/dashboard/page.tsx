"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { fetchMyLogs } from "@/store/attendanceSlice";
import { fetchMyLeaves } from "@/store/leaveSlice";

export default function StudentDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { myLogs, loading: logsLoading } = useSelector((state: RootState) => state.attendance);
  const { myLeaves, loading: leavesLoading } = useSelector((state: RootState) => state.leave);

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    dispatch(fetchMyLogs());
    dispatch(fetchMyLeaves());

    // Setup polling every 5 seconds for live updates
    const interval = setInterval(() => {
      dispatch(fetchMyLogs());
      dispatch(fetchMyLeaves());
    }, 5000);

    return () => clearInterval(interval);
  }, [token, dispatch]);

  const presentCount = myLogs.filter(log => log.status === 'Verified').length;
  const lateCount = myLogs.filter(log => log.arrivalStatus === 'Late').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const loading = (logsLoading && myLogs.length === 0) || (leavesLoading && myLeaves.length === 0);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading your data...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold dark:text-zinc-50">Welcome, {user?.name}</h1>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Here is your attendance overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-green-500">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Present</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{presentCount}</h2>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-yellow-500">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Late Arrivals</p>
            <h2 className="text-2xl font-bold text-yellow-600 mt-1">{lateCount}</h2>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-blue-500">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Leave Requests</p>
            <h2 className="text-2xl font-bold text-blue-600 mt-1">{myLeaves.length}</h2>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Attendance */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Recent Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 uppercase">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {myLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No attendance records found.</td>
                  </tr>
                ) : (
                  [...myLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((log) => (
                    <tr key={log.attendanceId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{log.studentName}</td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-4 text-zinc-500 font-mono">{formatTime(log.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === "Verified"
                          ? log.arrivalStatus === "Late"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                          {log.status === "Proxy" ? "Proxy Alert" : log.arrivalStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* My Leaves */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 uppercase">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {myLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No leave requests found.</td>
                  </tr>
                ) : (
                  [...myLeaves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((leave) => (
                    <tr key={leave.leaveId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{leave.studentName}</td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{formatDate(leave.date)}</td>
                      <td className="px-6 py-4 text-zinc-500 max-w-[150px] truncate">{leave.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${leave.status === 'Approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : leave.status === 'Rejected'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
