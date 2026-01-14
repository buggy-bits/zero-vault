import api from "./api";
import { API_ENDPOINTS } from "../constants";
import { LoginCredentials, RegisterCredentials, User } from "../types";

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const { data: user, publicKey, encryptedPrivateKey } = response.data;
    return { user, publicKey, encryptedPrivateKey };
  },

  async guestLogin() {
    const response = await api.get(API_ENDPOINTS.AUTH.GUEST_LOGIN);
    const { data: user } = response.data;
    return user;
  },

  async register(credentials: RegisterCredentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, credentials);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  logout() {
    return api.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      // We cannot check httpOnly cookies from JavaScript,
      // so we verify by calling /me endpoint instead
      await api.get(API_ENDPOINTS.AUTH.ME);
      return true;
    } catch {
      return false;
    }
  },
};
