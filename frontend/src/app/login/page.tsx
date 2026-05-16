"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { login, clearError } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, role, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'ADMIN') {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  }, [isAuthenticated, role, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login({ username, password }));
  };

  const autofill = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setUsername('Admin');
      setPassword('Admin123');
    } else {
      setUsername('Student');
      setPassword('Student123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome Back</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
            Sign in to access your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t dark:border-zinc-800">
          <p className="text-xs text-zinc-500 text-center mb-3">Quick Login (Demo)</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => autofill('admin')}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => autofill('student')}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
