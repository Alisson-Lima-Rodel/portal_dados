import apiClient from "./apiClient";
import type { LoginRequest, TokenResponse, RefreshRequest } from "@/types";

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/login", data);
  return res.data;
}

export async function refreshToken(data: RefreshRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/refresh", data);
  return res.data;
}
