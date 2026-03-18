import { create } from "zustand";
import { persist } from "zustand/middleware";

// Stores user + both tokens in localStorage.
// No cookies = no cross-origin Safari blocking issues.
export const authStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      authReady: false,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setAuthReady: (ready) => set({ authReady: ready }),

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "campus-exchange-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        // authReady intentionally NOT persisted
      }),
    }
  )
);
