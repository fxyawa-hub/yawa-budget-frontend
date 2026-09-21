import apiClient from "./client";
import {
  AskYawaBudgetPayload,
  AskYawaBudgetResponse,
  AskSmartBudgetPayload,
  AskSmartBudgetResponse,
  CategorizePayload,
  CategorizeResponse,
} from "../types";

export async function categorizeTransactionApi(payload: CategorizePayload): Promise<CategorizeResponse> {
  const response = await apiClient.post<CategorizeResponse>("/ai/categorize", payload);
  return response.data;
}

export async function askYawaBudgetApi(payload: AskYawaBudgetPayload): Promise<AskYawaBudgetResponse> {
  const response = await apiClient.post<AskYawaBudgetResponse>("/ai/ask", payload);
  return response.data;
}

// Backward-compatibility alias
export const askSmartBudgetApi = askYawaBudgetApi;

