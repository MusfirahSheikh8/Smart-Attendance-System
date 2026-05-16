"use client";

import Link from "next/link";
import { Camera, ShieldCheck, Home, LogOut, User as UserIcon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-4 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight dark:text-zinc-100">SmartAttendance</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
            <Home className="h-4 w-4" />
            Home
          </Link>
          
          <Link href="/attendance" className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
            <Camera className="h-4 w-4" />
            Capture
          </Link>

          {isAuthenticated && role === 'ADMIN' && (
            <>
              <Link href="/admin/dashboard" className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
                <ShieldCheck className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/admin/leaves" className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
                <ShieldCheck className="h-4 w-4" />
                Leaves
              </Link>
              <Link href="/admin/enroll" className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Enroll Student
              </Link>
            </>
          )}

          {isAuthenticated && role === 'STUDENT' && (
            <>
              <Link href="/leave" className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
                Apply Leave
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors cursor-pointer border-none bg-transparent font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link href="/auth/login" className="flex items-center gap-2 text-blue-600 font-bold">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}