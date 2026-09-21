import apiClient from "./client";
import { MonoAccount, MonoInstitution, MonoSyncResponse } from "../types";

export async function getMonoInstitutionsApi(): Promise<MonoInstitution[]> {
  const response = await apiClient.get<MonoInstitution[]>("/mono/institutions");
  return response.data;
}

export async function getMonoAccountsApi(): Promise<MonoAccount[]> {
  const response = await apiClient.get<MonoAccount[]>("/mono/accounts");
  return response.data;
}

export interface ConnectMonoPayload {
  institutionName: string;
  accountNumber?: string;
  authCode?: string;
}

export async function connectMonoAccountApi(payload: ConnectMonoPayload): Promise<MonoAccount> {
  const response = await apiClient.post<MonoAccount>("/mono/connect", payload);
  return response.data;
}

export async function syncMonoTransactionsApi(accountId: string): Promise<MonoSyncResponse> {
  const response = await apiClient.post<MonoSyncResponse>(`/mono/sync/${accountId}`);
  return response.data;
}

export async function unlinkMonoAccountApi(accountId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/mono/accounts/${accountId}`);
  return response.data;
}
