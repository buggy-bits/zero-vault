import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_ENDPOINTS } from '../constants';
import { ENV } from '../config/env';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token && !config.url?.includes('/auth/')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          try {
            const refreshResponse = await this.client.get(API_ENDPOINTS.AUTH.REFRESH);
            const newToken = refreshResponse.data.accessToken;
            localStorage.setItem('accessToken', newToken);

            // Retry original request
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  public get client_instance() {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService.client_instance;
