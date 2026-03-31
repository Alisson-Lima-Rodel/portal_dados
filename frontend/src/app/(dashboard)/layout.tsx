"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DashboardSearch } from "@/components/common/DashboardSearch";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useAuditLog();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <DashboardSearch />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <div className="lg:hidden mb-4">
              <MobileSidebar />
            </div>
            <Breadcrumbs />
            {children}
          </div>
        </main>
        <ScrollToTop />
      </div>
    </div>
  );
}
