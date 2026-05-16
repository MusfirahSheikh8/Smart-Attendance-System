"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { updateLeaveStatus } from "@/store/leaveSlice";
import { Check, X, Loader2 } from "lucide-react";

export default function LeaveRequests() {
  const dispatch = useDispatch<AppDispatch>();
  const { leaveRequests, loading } = useSelector((state: RootState) => state.leave);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleStatusChange = async (
    leaveId: number,
    status: 'Approved' | 'Rejected',
    currentStatus: string
  ) => {
    if (status === currentStatus) return;
    setProcessingId(leaveId);
    try {
      await dispatch(
        updateLeaveStatus({
          leaveId,
          status
        })
      ).unwrap();
    } catch (err: any) {
      console.error("Failed to update leave status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b dark:border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Leave Requests
        </h3>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {leaveRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  {loading ? "Loading requests..." : "No leave requests found."}
                </td>
              </tr>
            ) : (
              leaveRequests.map((leave) => (
                <tr
                  key={leave.leaveId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {leave.studentName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      ID: {leave.studentId}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                    {formatDate(leave.date)}
                  </td>

                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                    {leave.reason}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${leave.status === 'Approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : leave.status === 'Rejected'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleStatusChange(leave.leaveId, 'Approved', leave.status)}
                        disabled={processingId === leave.leaveId}
                        className={`p-2 rounded-lg transition-all ${leave.status === 'Approved'
                          ? 'bg-green-600 text-white shadow-md scale-110'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                          }`}
                        title="Approve"
                      >
                        {processingId === leave.leaveId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleStatusChange(leave.leaveId, 'Rejected', leave.status)}
                        disabled={processingId === leave.leaveId}
                        className={`p-2 rounded-lg transition-all ${leave.status === 'Rejected'
                          ? 'bg-red-600 text-white shadow-md scale-110'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                          }`}
                        title="Reject"
                      >
                        {processingId === leave.leaveId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

