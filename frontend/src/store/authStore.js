import { create } from "zustand";

export const authStore = create((set) => ({
  user: null,
  accessToken: null,

  setUser: (user) => set({ user }),

  setAccessToken: (token) => set({ accessToken: token }),

  login: (user, token) =>
    set({
      user,
      accessToken: token,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
    }),
}));