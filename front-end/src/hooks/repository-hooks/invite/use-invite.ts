import { InviteStatus } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const databaseService = serviceHost.getDatabaseService();
const inviteRepository = repositoryHost.getInviteRepository(databaseService);

type UpdateInviteParams = Parameters<typeof inviteRepository.update>[0];

export const useInvitesByEmail = (email: string) => {
  return useQuery({
    queryKey: ["invites", "byEmail", email],
    queryFn: () =>
      inviteRepository.getAll({
        queryConstraints: [
          { field: "inviteeEmail", operator: "==", value: email },
        ],
        orderBy: {
          field: "createdAt",
          direction: "desc",
        },
      }),
    enabled: !!email,
  });
};

export const useInvitesByOrganization = (organizationId: string) => {
  return useQuery({
    queryKey: ["invites", "byOrganization", organizationId],
    queryFn: () =>
      inviteRepository.getAll({
        queryConstraints: [
          { field: "organizationId", operator: "==", value: organizationId },
        ],
        orderBy: {
          field: "createdAt",
          direction: "desc",
        },
      }),
    enabled: !!organizationId,
  });
};

export const useInvite = (id: string) => {
  return useQuery({
    queryKey: ["invite", "id", id],
    queryFn: () => inviteRepository.get({ id }),
    enabled: !!id,
  });
};

export const useUpdateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateInviteParams>({
    mutationKey: ["invite", "update"],
    mutationFn: async (params: UpdateInviteParams) => {
      return inviteRepository.update(params);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invite", "id", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["invites", "byEmail"] });
    },
  });
};

export const useDeclineInvite = () => {
  const updateInvite = useUpdateInvite();

  return useMutation<void, Error, { inviteId: string }>({
    mutationKey: ["invite", "decline"],
    mutationFn: async ({ inviteId }) => {
      return updateInvite.mutateAsync({
        id: inviteId,
        data: { status: InviteStatus.DECLINED },
      });
    },
  });
};