import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreateOrganizationInviteParams {
  organizationId: string;
  inviteeEmail: string;
  inviteeRoleIds: string[];
  validFor?: number;
}

export const useCreateOrganizationInvite = () => {
  const queryClient = useQueryClient();
  const functionsService = serviceHost.getFunctionsService();

  return useMutation<string, Error, CreateOrganizationInviteParams>({
    mutationKey: ["createOrganizationInvite"],
    mutationFn: async (params: CreateOrganizationInviteParams) => {
      return functionsService.createOrganizationInvite(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate invites queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["invites", "byOrganization", variables.organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
};
