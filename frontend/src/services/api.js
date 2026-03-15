import axios from "axios";
import { authStore } from "../store/authStore";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post("http://localhost:5000/api/auth/refresh", {}, { withCredentials: true });
        authStore.getState().setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch {
        authStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
