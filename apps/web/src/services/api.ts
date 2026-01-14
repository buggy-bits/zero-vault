import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_ENDPOINTS, ROUTES } from "../constants";
import { ENV } from "../config/env";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalConfig = error.config as CustomAxiosRequestConfig;

        // 1️⃣ If no response → network error
        if (!error.response) {
          return Promise.reject(error);
        }

        const status = error.response.status;
        const url = originalConfig.url || "";

        // 2️⃣ DO NOT refresh for these endpoints
        const skipRefresh =
          url.includes("/api/v1/auth/me") ||
          url.includes("/api/v1/auth/token/refresh");

        if (status === 401 && !skipRefresh && !originalConfig._retry) {
          originalConfig._retry = true;
          try {
            // Send refresh request; server will update cookies
            await this.client.post(API_ENDPOINTS.AUTH.REFRESH);

            //  Retry the original request
            return this.client.request(originalConfig);
          } catch {
            window.location.href = ROUTES.LOGIN;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public get client_instance() {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService.client_instance;
