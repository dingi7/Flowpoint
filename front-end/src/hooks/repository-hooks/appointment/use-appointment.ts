import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getNextPageParam } from "../utils/page-params";
import { getDateRangeForQuery } from "@/utils/date-time";

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
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
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

/**
 * Hook to get appointments for a specific date using query constraints
 * @param date - The date to query appointments for (will be normalized to local midnight)
 * @returns Query result with appointments for the specified date
 */
export function useGetAppointmentsByDate(date: Date) {
  const organizationId = useCurrentOrganizationId();
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);
  
  const { startOfDay, endOfDay } = getDateRangeForQuery(normalizedDate);
  
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return useQuery({
    queryKey: ["appointments", "byDate", organizationId, dateKey],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "startTime", operator: ">=", value: startOfDay },
          { field: "startTime", operator: "<=", value: endOfDay },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId,
  });
}

export function useGetAppointmentsByAssignee(assigneeId: string) {
  const organizationId = useCurrentOrganizationId();
  return useQuery({
    queryKey: ["appointments", "byAssignee", organizationId, assigneeId],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [{ field: "assigneeId", operator: "==", value: assigneeId }],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId && !!assigneeId,
  });
}

export function useGetAppointmentsByAssigneeAndDate(assigneeId: string, date: Date) {
  const organizationId = useCurrentOrganizationId();

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);
  
  const { startOfDay, endOfDay } = getDateRangeForQuery(normalizedDate);
  
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return useQuery({
    queryKey: ["appointments", "byAssignee", organizationId, assigneeId, dateKey],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "assigneeId", operator: "==", value: assigneeId },
          { field: "startTime", operator: ">=", value: startOfDay },
          { field: "startTime", operator: "<=", value: endOfDay },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId && !!assigneeId,
  });
}