import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";

const databaseService = serviceHost.getDatabaseService();
const roleRepository = repositoryHost.getRoleRepository(databaseService);

type CreateRoleParams = Parameters<typeof roleRepository.create>[0];
type UpdateRoleParams = Parameters<typeof roleRepository.update>[0];
type DeleteRoleParams = Parameters<typeof roleRepository.delete>[0];

// Create role
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateRoleParams>({
    mutationKey: ["role", "create"],
    mutationFn: async (params: CreateRoleParams) => {
      return roleRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "get"] });
    },
  });
}

// Get roles by organization
export function useRoles(options: GetOptions = {}) {
  const currentOrganizationId = useCurrentOrganizationId();
  
  return useQuery({
    queryKey: ["roles", "get", JSON.stringify(options), currentOrganizationId],
    queryFn: () => roleRepository.getAll({
      ...options,
      organizationId: currentOrganizationId!,
    }),
    enabled: !!currentOrganizationId,
  });
}

// Get role by ID
export function useRole(id: string) {
  const currentOrganizationId = useCurrentOrganizationId();
  
  return useQuery({
    queryKey: ["role", "get", id, currentOrganizationId],
    queryFn: () => roleRepository.get({
      id,
      organizationId: currentOrganizationId!,
    }),
    enabled: !!id && !!currentOrganizationId,
  });
}

// Update role
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateRoleParams>({
    mutationKey: ["role", "update"],
    mutationFn: async (params: UpdateRoleParams) => {
      return roleRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "get"] });
    },
  });
}

// Delete role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteRoleParams>({
    mutationKey: ["role", "delete"],
    mutationFn: async (params: DeleteRoleParams) => {
      return roleRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "get"] });
    },
  });
}