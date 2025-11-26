import { useQuery } from "@tanstack/react-query";
import { serviceHost } from "@/services";
import { ORGANIZATION_ID } from "@/constants";

interface UseAvailableTimeslotsProps {
  serviceId?: string;
  date?: string;
  assigneeId?: string;
  enabled?: boolean;
}

interface Timeslot {
  start: string;
  end: string;
}

interface AvailableTimeslotsResponse {
  result: Timeslot[];
}

export function useAvailableTimeslots({
  serviceId,
  date,
  assigneeId,
  enabled = true,
}: UseAvailableTimeslotsProps) {
  const functionsService = serviceHost.getFunctionsService();
  const organizationId = ORGANIZATION_ID;

  return useQuery<AvailableTimeslotsResponse, Error>({
    queryKey: ["availableTimeslots", serviceId, date, assigneeId, organizationId],
    queryFn: async () => {
      if (!serviceId || !date || !organizationId || !assigneeId) {
        throw new Error("Missing required parameters");
      }

      return await functionsService.getAvailableTimeslots({
        serviceId,
        date,
        organizationId,
        assigneeId,
      });
    },
    enabled: enabled && !!serviceId && !!date && !!assigneeId && !!organizationId,
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