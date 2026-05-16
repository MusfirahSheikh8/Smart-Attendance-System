"use client";

import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentLeavePage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";
  
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage("");

    try {
      await axios.post(`${apiBaseUrl}/leave/apply`, {
        studentId: parseInt(studentId, 10),
        reason,
        date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatus('success');
      setMessage("Leave request submitted successfully. It is pending admin approval.");
      setReason("");
      setDate("");
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 w-full flex flex-col gap-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl mb-4">
          <Calendar size={32} />
        </div>
        <h1 className="text-3xl font-bold dark:text-zinc-50">Apply for Leave</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Submit your leave request for admin approval.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-start gap-3">
            <CheckCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Student ID
            </label>
            <input
              type="number"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 1"
              className="px-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date of Leave
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reason
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to take a leave..."
              className="px-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
