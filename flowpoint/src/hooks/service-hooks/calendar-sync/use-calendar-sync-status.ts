import { serviceHost } from "@/services";
import { useQuery } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export function useCalendarSyncStatus(organizationId?: string) {
  return useQuery({
    queryKey: ["calendarSync", "status", organizationId],
    queryFn: () =>
      functionsService.getMyCalendarSyncStatus({
        organizationId: organizationId!,
      }),
    enabled: !!organizationId,
  });
}
