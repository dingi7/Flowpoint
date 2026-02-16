import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export function useToggleCalendarSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["calendarSync", "toggle"],
    mutationFn: async (payload: { organizationId: string; enabled: boolean }) =>
      functionsService.setMyCalendarAutoSync(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["calendarSync", "status", variables.organizationId],
      });
    },
  });
}
