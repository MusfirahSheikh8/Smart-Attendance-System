"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState } from "@/store";

export default function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('ADMIN' | 'STUDENT')[] }) {
  const { isAuthenticated, role, loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!isAuthenticated) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      // Redirect based on role
      if (role === 'ADMIN') {
        router.replace("/admin/dashboard");
      } else if (role === 'STUDENT') {
        router.replace("/student/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, role, loading, pathname, router, allowedRoles, mounted]);

  const shouldHide = !mounted || (!isAuthenticated && pathname !== "/login") || (allowedRoles && role && !allowedRoles.includes(role));

  return (
    <div style={{ opacity: shouldHide ? 0 : 1, transition: 'opacity 0.2s' }}>
      {children}
    </div>
  );
}
