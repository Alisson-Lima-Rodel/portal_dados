import apiClient from "./apiClient";
import type { User, UserCreate, UserUpdate } from "@/types";

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>("/users/me");
  return res.data;
}

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>("/users");
  return res.data;
}

export async function getUser(id: number): Promise<User> {
  const res = await apiClient.get<User>(`/users/${id}`);
  return res.data;
}

export async function createUser(data: UserCreate): Promise<User> {
  const res = await apiClient.post<User>("/users", data);
  return res.data;
}

export async function updateUser(id: number, data: UserUpdate): Promise<User> {
  const res = await apiClient.put<User>(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function getMyLayout(): Promise<Record<string, unknown>> {
  const res = await apiClient.get("/users/me/layout");
  return res.data;
}

export async function saveMyLayout(layout_json: Record<string, unknown>): Promise<void> {
  await apiClient.put("/users/me/layout", { layout_json });
}
