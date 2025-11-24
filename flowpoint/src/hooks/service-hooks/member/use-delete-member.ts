import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export interface DeleteMemberFromOrganizationParams {
  memberId: string;
  organizationId: string;
}

export const useDeleteMemberFromOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteMemberFromOrganization"],
    mutationFn: async (params: DeleteMemberFromOrganizationParams) => {
      return functionsService.kickOrganizationMember(params);
    },
    onSuccess: () => {
      // Invalidate and refetch member-related queries
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
};
