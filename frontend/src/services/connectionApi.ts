import apiClient from "./apiClient";
import type { Connection, ConnectionCreate, ConnectionUpdate } from "@/types";

export async function getConnections(): Promise<Connection[]> {
  const res = await apiClient.get<Connection[]>("/connections");
  return res.data;
}

export async function getConnection(id: number): Promise<Connection> {
  const res = await apiClient.get<Connection>(`/connections/${id}`);
  return res.data;
}

export async function createConnection(data: ConnectionCreate): Promise<Connection> {
  const res = await apiClient.post<Connection>("/connections", data);
  return res.data;
}

export async function updateConnection(
  id: number,
  data: ConnectionUpdate
): Promise<Connection> {
  const res = await apiClient.put<Connection>(`/connections/${id}`, data);
  return res.data;
}

export async function deleteConnection(id: number): Promise<void> {
  await apiClient.delete(`/connections/${id}`);
}
