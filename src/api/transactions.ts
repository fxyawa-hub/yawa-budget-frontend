import apiClient from "./client";
import { CreateTransactionPayload, Transaction } from "../types";

export async function getTransactionsApi(): Promise<Transaction[]> {
  const response = await apiClient.get<Transaction[]>("/transactions");
  return response.data;
}

export async function createTransactionApi(payload: CreateTransactionPayload): Promise<Transaction> {
  const response = await apiClient.post<Transaction>("/transactions", payload);
  return response.data;
}
