import { useQuery } from "@tanstack/react-query";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface UseAvailableTimeslotsProps {
  serviceId?: string;
  date?: string;
  enabled?: boolean;
}

interface Timeslot {
  start: string;
  end: string;
}

interface AvailableTimeslotsResponse {
  timeslots: Timeslot[];
}

export function useAvailableTimeslots({
  serviceId,
  date,
  enabled = true,
}: UseAvailableTimeslotsProps) {
  const functionsService = serviceHost.getFunctionsService();
  const organizationId = useCurrentOrganizationId();

  return useQuery<AvailableTimeslotsResponse, Error>({
    queryKey: ["availableTimeslots", serviceId, date, organizationId],
    queryFn: async () => {
      if (!serviceId || !date || !organizationId) {
        throw new Error("Missing required parameters");
      }

      return await functionsService.getAvailableTimeslots({
        serviceId,
        date,
        organizationId,
      });
    },
    enabled: enabled && !!serviceId && !!date && !!organizationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error.message.includes("400") || error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}