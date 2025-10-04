import { User } from "@/core";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";

interface UserStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;

  // Computed getters removed to prevent infinite loops
}

const initialState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

export const useUserStore = create<UserStore>()(devtools(
  (set) => ({
    ...initialState,

    // Actions
    setUser: (user: User | null) =>
      set({ user }, false, "setUser"),

    updateUser: (updates: Partial<User>) =>
      set(
        (state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }),
        false,
        "updateUser"
      ),

    setLoading: (loading: boolean) => set({ isLoading: loading }, false, "setLoading"),

    setError: (error: string | null) => set({ error }, false, "setError"),

    clearError: () => set({ error: null }, false, "clearError"),

    setInitialized: (initialized: boolean) => set({ isInitialized: initialized }, false, "setInitialized"),

    reset: () => set(initialState, false, "reset"),

    // No computed getters - moved to selector hooks to avoid infinite loops
  }),
  {
    name: "user-store",
  }
));

// Selector hooks for better performance
export const useUser = () =>
  useUserStore((state) => state.user);

export const useUserLoading = () =>
  useUserStore((state) => state.isLoading);

export const useUserError = () =>
  useUserStore((state) => state.error);

export const useUserInitialized = () =>
  useUserStore((state) => state.isInitialized);

export const useUserOrganizationIds = () =>
  useUserStore((state) => state.user?.organizationIds || []);

export const useHasOrganizations = () =>
  useUserStore((state) => (state.user?.organizationIds || []).length > 0);

export const useCurrentUserId = () =>
  useUserStore((state) => state.user?.id || null);

// Action hooks
export const useUserActions = () => {
  const setUser = useUserStore((state) => state.setUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const setError = useUserStore((state) => state.setError);
  const clearError = useUserStore((state) => state.clearError);
  const setInitialized = useUserStore((state) => state.setInitialized);
  const reset = useUserStore((state) => state.reset);

  return useMemo(
    () => ({
      setUser,
      updateUser,
      setLoading,
      setError,
      clearError,
      setInitialized,
      reset,
    }),
    [setUser, updateUser, setLoading, setError, clearError, setInitialized, reset]
  );
};