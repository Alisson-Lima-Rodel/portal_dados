import apiClient from "./apiClient";
import type { Area } from "@/types";

export async function getAreas(): Promise<Area[]> {
  const res = await apiClient.get<Area[]>("/areas");
  return res.data;
}

export async function createArea(data: Omit<Area, "id">): Promise<Area> {
  const res = await apiClient.post<Area>("/areas", data);
  return res.data;
}

export async function updateArea(id: number, data: Partial<Area>): Promise<Area> {
  const res = await apiClient.put<Area>(`/areas/${id}`, data);
  return res.data;
}

export async function deleteArea(id: number): Promise<void> {
  await apiClient.delete(`/areas/${id}`);
}
