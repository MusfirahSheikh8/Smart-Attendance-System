"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setFilter } from "@/store/attendanceSlice";

export default function AttendanceLogs() {
  const dispatch = useDispatch();
  const { logs, filter } = useSelector((state: RootState) => state.attendance);
  const [prevLogsCount, setPrevLogsCount] = useState(logs.length);

  // New logs highlighting effect
  useEffect(() => {
    if (logs.length > prevLogsCount) {
      setPrevLogsCount(logs.length);
    }
  }, [logs.length, prevLogsCount]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "Verified") return log.status === "Verified";
    if (filter === "Proxy") return log.status === "Proxy";
    if (filter === "Late") return log.arrivalStatus === "Late";
    return true; // All
  });

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b dark:border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Live Attendance Logs</h3>

        {/* Filters */}
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {["All", "Verified", "Proxy", "Late"].map((f) => (
            <button
              key={f}
              onClick={() => dispatch(setFilter(f as any))}
              className={`px-3 py-1 text-sm rounded-md transition-all ${filter === f
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-medium"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Auth Status</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4">Arrival Status</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  No attendance logs found for current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                // Highlight the newest rows that just arrived (top of list)
                const isNew = logs.length > prevLogsCount && index < (logs.length - prevLogsCount);

                return (
                  <tr
                    key={log.attendanceId}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isNew ? "animate-fadeHighlight" : ""
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{log.studentName}</div>
                      <div className="text-xs text-zinc-500">ID: {log.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${log.status === "Verified"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                      >
                        {log.status === "Proxy" ? "Proxy Alert" : "Verified"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.confidenceScore.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${log.arrivalStatus === "Late"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                      >
                        {log.arrivalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono">
                      {formatTime(log.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
