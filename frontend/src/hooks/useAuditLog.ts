"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendAuditLog } from "@/services/auditApi";

export function useAuditLog() {
  const pathname = usePathname();

  useEffect(() => {
    const dashboardMatch = pathname.match(/\/(\d+)$/);
    const dashboard_id = dashboardMatch ? Number(dashboardMatch[1]) : undefined;

    // Fire-and-forget — não bloqueia a navegação
    sendAuditLog({ pagina: pathname, dashboard_id }).catch(() => {});
  }, [pathname]);
}
