import axios from "axios";
import { authStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30s timeout handles Render cold start wake-up
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401, then retry the original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        authStore.getState().setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch {
        // Refresh failed — clear auth and let the user log in again
        authStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Render cold-start wake-up ──────────────────────────────────────────────
// Render free tier sleeps after 15 min of inactivity. The first request takes
// ~30 seconds. This ping fires immediately when the JS loads, so the backend
// is warm by the time the user clicks anything.
if (import.meta.env.VITE_API_URL) {
  axios.get(`${BASE_URL.replace("/api", "")}/`).catch(() => {});
}
