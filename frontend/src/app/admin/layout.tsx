"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LogOut, LayoutDashboard, FileText, Download, UserPlus } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/authSlice";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const exportReport = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${apiBaseUrl}/reports/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "attendance_report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert("Failed to export report.");
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
        {/* Admin Navbar */}
        <nav className="border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-500">
                <ShieldCheck className="h-6 w-6" />
                Admin Portal
              </Link>
              
              <div className="hidden md:flex gap-6">
                <Link href="/admin/dashboard" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/admin/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/admin/enroll" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/admin/enroll' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </Link>
                <Link href="/admin/leaves" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/admin/leaves' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <FileText className="h-4 w-4" />
                  Leave Requests
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={exportReport}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="flex items-center gap-3 border-l dark:border-zinc-800 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                  <p className="text-xs text-zinc-500">Administrator</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
