import apiClient from "./client";
import { Budget, BudgetSummaryResponse, SetBudgetPayload } from "../types";

export async function getBudgetSummaryApi(): Promise<BudgetSummaryResponse> {
  const response = await apiClient.get<BudgetSummaryResponse>("/budgets/summary");
  return response.data;
}

export async function getBudgetsApi(): Promise<Budget[]> {
  const response = await apiClient.get<Budget[]>("/budgets");
  return response.data;
}

export async function setBudgetApi(payload: SetBudgetPayload): Promise<Budget> {
  const response = await apiClient.post<Budget>("/budgets", payload);
  return response.data;
}
