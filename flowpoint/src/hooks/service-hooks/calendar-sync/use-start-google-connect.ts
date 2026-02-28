import { serviceHost } from "@/services";
import { useMutation } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export function useStartGoogleConnect() {
  return useMutation({
    mutationKey: ["calendarSync", "startGoogleConnect"],
    mutationFn: async (payload: { organizationId: string; returnUrl: string }) =>
      functionsService.startGoogleCalendarConnect(payload),
  });
}
