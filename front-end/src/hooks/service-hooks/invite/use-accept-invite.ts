import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceHost } from "@/services";

const functionsService = serviceHost.getFunctionsService();

export interface AcceptInviteParams {
  inviteId: string;
  name: string;
  image?: string;
  description?: string;
}

export const useAcceptOrganizationInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["acceptOrganizationInvite"],
    mutationFn: async (params: AcceptInviteParams) => {
      return functionsService.acceptOrganizationInvite(params);
    },
    onSuccess: () => {
      // Invalidate and refetch invitation-related queries
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};