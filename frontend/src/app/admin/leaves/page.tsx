"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchLeaves } from "@/store/leaveSlice";
import LeaveRequests from "@/components/dashboard/LeaveRequests";

export default function AdminLeavesPage() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchLeaves());
    
    // Poll every 10 seconds for leaves
    const interval = setInterval(() => {
      dispatch(fetchLeaves());
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-zinc-50">Leave Management</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Review and approve student leave requests.
        </p>
      </div>

      <LeaveRequests />
    </div>
  );
}
