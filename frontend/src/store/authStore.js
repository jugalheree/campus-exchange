import { create } from "zustand";
import { persist } from "zustand/middleware";

// Persists user + token to localStorage so reload doesn't log you out.
// accessToken is short-lived (15min) but gets refreshed automatically by
// the api interceptor — we just need it to not be null on first render.
export const authStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      authReady: false,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthReady: (ready) => set({ authReady: ready }),

      login: (user, token) => set({ user, accessToken: token }),

      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "campus-exchange-auth", // localStorage key
      // Only persist user — accessToken will be refreshed on load anyway
      // but keeping it means instant auth check without a flicker
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
