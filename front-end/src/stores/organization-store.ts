import { Organization } from "@/core";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";

interface OrganizationStore {
  // State
  organizations: Organization[];
  selectedOrganization: Organization | null;
  currentOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setOrganizations: (organizations: Organization[]) => void;
  addOrganization: (organization: Organization) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  removeOrganization: (id: string) => void;
  setSelectedOrganization: (organization: Organization | null) => void;
  setCurrentOrganizationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Computed getters
  getCurrentOrganization: () => Organization | null;
  getOrganizationById: (id: string) => Organization | null;
}

const initialState = {
  organizations: [],
  selectedOrganization: null,
  currentOrganizationId: null,
  isLoading: false,
  error: null,
};

export const useOrganizationStore = create<OrganizationStore>()(devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setOrganizations: (organizations: Organization[]) =>
        set(
          (state) => {
            // If there's a currentOrganizationId, sync selectedOrganization with it
            const selectedOrg = state.currentOrganizationId
              ? organizations.find((org) => org.id === state.currentOrganizationId) || null
              : null;
            return {
              organizations,
              selectedOrganization: selectedOrg || state.selectedOrganization,
            };
          },
          false,
          "setOrganizations"
        ),

      addOrganization: (organization: Organization) =>
        set(
          (state) => ({
            organizations: [...state.organizations, organization],
          }),
          false,
          "addOrganization"
        ),

      updateOrganization: (id: string, updates: Partial<Organization>) =>
        set(
          (state) => ({
            organizations: state.organizations.map((org) =>
              org.id === id ? { ...org, ...updates } : org
            ),
            selectedOrganization:
              state.selectedOrganization?.id === id
                ? { ...state.selectedOrganization, ...updates }
                : state.selectedOrganization,
          }),
          false,
          "updateOrganization"
        ),

      removeOrganization: (id: string) =>
        set(
          (state) => ({
            organizations: state.organizations.filter((org) => org.id !== id),
            selectedOrganization:
              state.selectedOrganization?.id === id
                ? null
                : state.selectedOrganization,
            currentOrganizationId:
              state.currentOrganizationId === id
                ? null
                : state.currentOrganizationId,
          }),
          false,
          "removeOrganization"
        ),

      setSelectedOrganization: (organization: Organization | null) =>
        set({ selectedOrganization: organization }, false, "setSelectedOrganization"),

      setCurrentOrganizationId: (id: string | null) =>
        set(
          (state) => {
            const organization = id
              ? state.organizations.find((org) => org.id === id) || null
              : null;
            return {
              currentOrganizationId: id,
              selectedOrganization: organization,
            };
          },
          false,
          "setCurrentOrganizationId"
        ),

      setLoading: (loading: boolean) => set({ isLoading: loading }, false, "setLoading"),

      setError: (error: string | null) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),

      reset: () => set(initialState, false, "reset"),

      // Computed getters
      getCurrentOrganization: () => {
        const state = get();
        return state.currentOrganizationId
          ? state.organizations.find((org) => org.id === state.currentOrganizationId) || null
          : null;
      },

      getOrganizationById: (id: string) => {
        const state = get();
        return state.organizations.find((org) => org.id === id) || null;
      },
    }),
    {
      name: "organization-store",
    }
  ));

// Selector hooks for better performance
export const useOrganizations = () =>
  useOrganizationStore((state) => state.organizations);

export const useSelectedOrganization = () =>
  useOrganizationStore((state) => state.selectedOrganization);

export const useCurrentOrganization = () =>
  useOrganizationStore((state) => state.getCurrentOrganization());

export const useCurrentOrganizationId = () =>
  useOrganizationStore((state) => state.currentOrganizationId);

export const useOrganizationLoading = () =>
  useOrganizationStore((state) => state.isLoading);

export const useOrganizationError = () =>
  useOrganizationStore((state) => state.error);

// Action hooks
export const useOrganizationActions = () => {
  const setOrganizations = useOrganizationStore((state) => state.setOrganizations);
  const addOrganization = useOrganizationStore((state) => state.addOrganization);
  const updateOrganization = useOrganizationStore((state) => state.updateOrganization);
  const removeOrganization = useOrganizationStore((state) => state.removeOrganization);
  const setSelectedOrganization = useOrganizationStore((state) => state.setSelectedOrganization);
  const setCurrentOrganizationId = useOrganizationStore((state) => state.setCurrentOrganizationId);
  const setLoading = useOrganizationStore((state) => state.setLoading);
  const setError = useOrganizationStore((state) => state.setError);
  const clearError = useOrganizationStore((state) => state.clearError);
  const reset = useOrganizationStore((state) => state.reset);

  return useMemo(
    () => ({
      setOrganizations,
      addOrganization,
      updateOrganization,
      removeOrganization,
      setSelectedOrganization,
      setCurrentOrganizationId,
      setLoading,
      setError,
      clearError,
      reset,
    }),
    [setOrganizations, addOrganization, updateOrganization, removeOrganization, setSelectedOrganization, setCurrentOrganizationId, setLoading, setError, clearError, reset]
  );
};