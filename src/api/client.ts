import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Key for storing JWT in localStorage
export const TOKEN_STORAGE_KEY = "yawabudget_jwt";
export const USER_STORAGE_KEY = "yawabudget_user";
const LEGACY_TOKEN_KEY = "smartbudget_jwt";
const LEGACY_USER_KEY = "smartbudget_user";

// Create Axios client instance
const apiClient = axios.create({
  baseURL: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT token to every outgoing request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally by clearing storage and redirecting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      // Clear token and cached user
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);

      // Dispatch custom event so AuthContext can update state smoothly
      window.dispatchEvent(new CustomEvent("yawabudget:unauthorized"));
      window.dispatchEvent(new CustomEvent("smartbudget:unauthorized"));

      // If not already on login/register, redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        window.location.href = "/login?sessionExpired=true";
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract human-readable error messages from Axios responses
export function getErrorMessage(error: unknown, fallback: string = "An unexpected error occurred"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if ("error" in data && typeof data.error === "string") return data.error;
      if ("message" in data && typeof data.message === "string") return data.message;
    }
    if (error.message) {
      if (error.message.includes("Network Error")) {
        return "Network connection issue. Please verify your internet connection or backend server.";
      }
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export default apiClient;
