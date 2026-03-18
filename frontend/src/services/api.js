import axios from "axios";
import { authStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // no cookies needed anymore
  timeout: 30000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — use stored refreshToken to get a new accessToken, then retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const storedRefresh = authStore.getState().refreshToken;

      if (storedRefresh) {
        try {
          const res = await axios.post(
            `${BASE_URL}/auth/refresh`,
            { refreshToken: storedRefresh }, // send in body, not cookie
            { withCredentials: false }
          );
          const { accessToken, refreshToken } = res.data;
          authStore.getState().setAccessToken(accessToken);
          if (refreshToken) authStore.getState().setRefreshToken(refreshToken);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          authStore.getState().logout();
        }
      } else {
        authStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Wake up Render free tier the moment the app loads
if (import.meta.env.VITE_API_URL) {
  axios
    .get(import.meta.env.VITE_API_URL.replace("/api", "/"))
    .catch(() => {});
}
