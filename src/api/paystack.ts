import apiClient from "./client";
import {
  PaystackBank,
  PaystackResolveResponse,
  PaystackTransferPayload,
  PaystackTransferResult,
} from "../types";

export async function getPaystackBanksApi(): Promise<PaystackBank[]> {
  const response = await apiClient.get<PaystackBank[]>("/paystack/banks");
  return response.data;
}

export async function resolvePaystackAccountApi(
  accountNumber: string,
  bankCode: string
): Promise<PaystackResolveResponse> {
  const response = await apiClient.get<PaystackResolveResponse>("/paystack/resolve", {
    params: { account_number: accountNumber, bank_code: bankCode },
  });
  return response.data;
}

export async function sendPaystackTransferApi(
  payload: PaystackTransferPayload
): Promise<PaystackTransferResult> {
  const response = await apiClient.post<PaystackTransferResult>("/paystack/transfer", payload);
  return response.data;
}

export async function getPaystackTransfersApi(): Promise<PaystackTransferResult[]> {
  const response = await apiClient.get<PaystackTransferResult[]>("/paystack/transfers");
  return response.data;
}
