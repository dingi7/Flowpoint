import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);

type CreateCalendarParams = Parameters<typeof calendarRepository.create>[0];
type UpdateCalendarParams = Parameters<typeof calendarRepository.update>[0];
type DeleteCalendarParams = Parameters<typeof calendarRepository.delete>[0];

export function useCalendars(options?: GetOptions) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["calendars", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      calendarRepository.getAll({
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

export function useCreateCalendar() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateCalendarParams>({
    mutationKey: ["calendar", "create"],
    mutationFn: async (params: CreateCalendarParams) => {
      return calendarRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateCalendarParams>({
    mutationKey: ["calendar", "update"],
    mutationFn: async (params: UpdateCalendarParams) => {
      return calendarRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteCalendarParams>({
    mutationKey: ["calendar", "delete"],
    mutationFn: async (params: DeleteCalendarParams) => {
      return calendarRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}
