import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const appointmentRepository = repositoryHost.getAppointmentRepository(databaseService);

type CreateAppointmentParams = Parameters<typeof appointmentRepository.create>[0];
type UpdateAppointmentParams = Parameters<typeof appointmentRepository.update>[0];
type DeleteAppointmentParams = Parameters<typeof appointmentRepository.delete>[0];

export function useAppointments(options?: GetOptions) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["appointments", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        ...(options || {}),
        pagination: {
          ...(options?.pagination || {}),
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options || {}),
    enabled: !!organizationId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateAppointmentParams>({
    mutationKey: ["appointment", "create"],
    mutationFn: async (params: CreateAppointmentParams) => {
      return appointmentRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "get"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateAppointmentParams>({
    mutationKey: ["appointment", "update"],
    mutationFn: async (params: UpdateAppointmentParams) => {
      return appointmentRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "get"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteAppointmentParams>({
    mutationKey: ["appointment", "delete"],
    mutationFn: async (params: DeleteAppointmentParams) => {
      return appointmentRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
