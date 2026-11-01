
import api, { setAccessToken } from "./api";

import type {
  LoginResponse,
  RegisterPayload,
  User,
} from "../types/auth.types";

// Reuse an in-progress refresh request instead of sending duplicates.
let refreshPromise: Promise<string> | null = null;

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
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const response = await api.post<{ access: string }>(
          "/auth/refresh/"
        );

        setAccessToken(response.data.access);

        return response.data.access;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout/");
    } finally {
      setAccessToken(null);
    }
  },
};
