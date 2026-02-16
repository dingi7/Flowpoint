import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export function useDisconnectCalendarSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["calendarSync", "disconnect"],
    mutationFn: async (payload: { organizationId: string }) =>
      functionsService.disconnectMyCalendarSync(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["calendarSync", "status", variables.organizationId],
      });
    },
  });
}
