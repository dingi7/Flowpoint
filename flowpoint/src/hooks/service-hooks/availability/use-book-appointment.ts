import { BookAppointmentPayload, BookAppointmentResponse } from "@/core";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UseBookAppointmentProps {
  onSuccess?: (data: BookAppointmentResponse) => void;
  onError?: (error: Error) => void;
}

export function useBookAppointment({
  onSuccess,
  onError,
}: UseBookAppointmentProps = {}) {
  const functionsService = serviceHost.getFunctionsService();
  const organizationId = useCurrentOrganizationId();
  const queryClient = useQueryClient();

  return useMutation<
    BookAppointmentResponse,
    Error,
    Omit<BookAppointmentPayload, "organizationId">
  >({
    mutationFn: async (payload) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return await functionsService.bookAppointment({
        ...payload,
        organizationId,
      });
    },
    onSuccess: (data) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["availableTimeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });

      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
}
