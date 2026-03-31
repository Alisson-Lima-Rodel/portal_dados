import apiClient from "./apiClient";
import type {
  Dashboard,
  DashboardCreate,
  DashboardUpdate,
  PaginatedResponse,
  Widget,
  WidgetCreate,
} from "@/types";

export async function getDashboardsCatalog(params: {
  search?: string;
  area_id?: number;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Dashboard>> {
  const res = await apiClient.get<PaginatedResponse<Dashboard>>(
    "/dashboards/catalog",
    { params }
  );
  return res.data;
}

export async function getDashboard(id: number): Promise<Dashboard> {
  const res = await apiClient.get<Dashboard>(`/dashboards/${id}`);
  return res.data;
}

export async function createDashboard(data: DashboardCreate): Promise<Dashboard> {
  const res = await apiClient.post<Dashboard>("/dashboards", data);
  return res.data;
}

export async function updateDashboard(
  id: number,
  data: DashboardUpdate
): Promise<Dashboard> {
  const res = await apiClient.put<Dashboard>(`/dashboards/${id}`, data);
  return res.data;
}

export async function deleteDashboard(id: number): Promise<void> {
  await apiClient.delete(`/dashboards/${id}`);
}

export async function getDashboardData(
  id: number
): Promise<Record<string, unknown[]>> {
  const res = await apiClient.get<Record<string, unknown[]>>(
    `/dashboards/${id}/data`
  );
  return res.data;
}

export async function getDashboardWidgets(id: number): Promise<Widget[]> {
  const res = await apiClient.get<Widget[]>(`/dashboards/${id}/widgets`);
  return res.data;
}

export async function createWidget(
  dashboardId: number,
  data: WidgetCreate
): Promise<Widget> {
  const res = await apiClient.post<Widget>(
    `/dashboards/${dashboardId}/widgets`,
    data
  );
  return res.data;
}

export async function getEmbedToken(
  dashboardId: number
): Promise<{ embedUrl: string; accessToken: string; reportId: string; tokenExpiry: string }> {
  const res = await apiClient.get(`/dashboards/${dashboardId}/embed-token`);
  return res.data;
}
