import apiClient from "./apiClient";
import type { AuditLog, AuditLogCreate, PaginatedResponse } from "@/types";

export async function sendAuditLog(data: AuditLogCreate): Promise<void> {
  await apiClient.post("/audit/log", data);
}

export async function getAuditLogs(params: {
  usuario_id?: number;
  dashboard_id?: number;
  data_inicio?: string;
  data_fim?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<AuditLog>> {
  const res = await apiClient.get<PaginatedResponse<AuditLog>>("/audit/logs", {
    params,
  });
  return res.data;
}
