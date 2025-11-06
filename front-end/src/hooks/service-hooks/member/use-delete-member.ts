import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceHost } from "@/services";

const functionsService = serviceHost.getFunctionsService();

export interface DeleteMemberFromOrganizationParams {
  userId: string;
  organizationId: string;
}

export const useDeleteMemberFromOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteMemberFromOrganization"],
    mutationFn: async (params: DeleteMemberFromOrganizationParams) => {
      return functionsService.deleteMember(params);
    },
    onSuccess: () => {
      // Invalidate and refetch member-related queries
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
};

