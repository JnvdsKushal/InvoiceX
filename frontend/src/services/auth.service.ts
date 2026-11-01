import api, { setAccessToken } from "./api";
import type {
  LoginResponse,
  RegisterPayload,
  User,
} from "../types/auth.types";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login/", {
      email,
      password,
    });

    setAccessToken(response.data.access);

    return response.data;
  },

  async register(payload: RegisterPayload) {
    const response = await api.post("/auth/register/", payload);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>("/auth/me/");
    return response.data;
  },

  async refresh(): Promise<string> {
    const response = await api.post<{ access: string }>("/auth/refresh/");

    setAccessToken(response.data.access);

    return response.data.access;
  },

  async logout() {
    try {
      await api.post("/auth/logout/");
    } finally {
      setAccessToken(null);
    }
  },
};