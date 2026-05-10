"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/login" && !auth.isAuthenticated()) {
      router.replace("/login");
    }
  }, [pathname, router]);

  if (pathname !== "/login" && !auth.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
