import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UseAnalyticsDashboardPayload {
  startDate?: string;
  endDate?: string;
}

const functionsService = serviceHost.getFunctionsService();

export function useAnalyticsDashboard(payload: UseAnalyticsDashboardPayload = {}) {
  const organizationId = useCurrentOrganizationId();

  return useQuery({
    queryKey: [
      "analyticsDashboard",
      organizationId,
      payload.startDate,
      payload.endDate,
    ],
    queryFn: () =>
      functionsService.getAnalyticsDashboard({
        organizationId: organizationId!,
        startDate: payload.startDate,
        endDate: payload.endDate,
      }),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRebuildAnalytics(payload: UseAnalyticsDashboardPayload = {}) {
  const organizationId = useCurrentOrganizationId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["analyticsDashboard", "rebuild", organizationId],
    mutationFn: () =>
      functionsService.rebuildAnalytics({
        organizationId: organizationId!,
        startDate: payload.startDate,
        endDate: payload.endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyticsDashboard", organizationId],
      });
    },
  });
}
