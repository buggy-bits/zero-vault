import api from "./api";
import { API_ENDPOINTS } from "../constants";
import { LoginCredentials, RegisterCredentials, User } from "../types";

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const {
      data: user,
      accessToken,
      publicKey,
      encryptedPrivateKey,
    } = response.data;
    console.log("data from server:", response.data);
    // localStorage.setItem("accessToken", accessToken);

    return { user, publicKey, encryptedPrivateKey, accessToken };
  },

  async guestLogin() {
    const response = await api.get(API_ENDPOINTS.AUTH.GUEST_LOGIN);
    const { data: user, accessToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    return user;
  },

  async register(credentials: RegisterCredentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, credentials);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/api/v1/user/me");
    return response.data;
  },

  logout() {
    localStorage.removeItem("accessToken");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  },
};
