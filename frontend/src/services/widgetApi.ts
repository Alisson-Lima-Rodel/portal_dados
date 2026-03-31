import apiClient from "./apiClient";
import type { Widget, WidgetUpdate } from "@/types";

export async function getWidget(id: number): Promise<Widget> {
  const res = await apiClient.get<Widget>(`/widgets/${id}`);
  return res.data;
}

export async function updateWidget(id: number, data: WidgetUpdate): Promise<Widget> {
  const res = await apiClient.put<Widget>(`/widgets/${id}`, data);
  return res.data;
}

export async function deleteWidget(id: number): Promise<void> {
  await apiClient.delete(`/widgets/${id}`);
}
