import apiClient from "./client";
import { AuthResponse, LoginPayload, RegisterPayload } from "../types";

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function deleteAccountApi(): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>("/auth/account");
  return response.data;
}
