"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, LogOut, LayoutDashboard, Calendar, UserCheck } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/authSlice";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
        {/* Student Navbar */}
        <nav className="border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/student/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-500">
                <UserCheck className="h-6 w-6" />
                Student Portal
              </Link>
              
              <div className="hidden md:flex gap-6">
                <Link href="/student/dashboard" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/student/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/student/capture" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/student/capture' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <Camera className="h-4 w-4" />
                  Mark Attendance
                </Link>
                <Link href="/student/leave" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/student/leave' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  <Calendar className="h-4 w-4" />
                  Apply Leave
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l dark:border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                  <p className="text-xs text-zinc-500">ID: {user?.id}</p>
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
