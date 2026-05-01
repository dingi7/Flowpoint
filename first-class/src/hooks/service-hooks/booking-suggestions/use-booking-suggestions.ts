import { useQuery } from "@tanstack/react-query";
import { ORGANIZATION_ID } from "@/constants";
import { BookingSuggestion } from "@/core";
import { serviceHost } from "@/services";

interface UseBookingSuggestionsProps {
  serviceId?: string;
  customerEmail?: string;
  enabled?: boolean;
}

interface BookingSuggestionsResponse {
  success: boolean;
  suggestions: BookingSuggestion[];
}

export function useBookingSuggestions({
  serviceId,
  customerEmail,
  enabled = true,
}: UseBookingSuggestionsProps) {
  const functionsService = serviceHost.getFunctionsService();
  const organizationId = ORGANIZATION_ID;

  return useQuery<BookingSuggestionsResponse, Error>({
    queryKey: ["bookingSuggestions", serviceId, customerEmail, organizationId],
    queryFn: async () => {
      if (!serviceId || !organizationId) {
        throw new Error("Missing required parameters");
      }

      return await functionsService.getBookingSuggestions({
        serviceId,
        customerEmail,
        organizationId,
      });
    },
    enabled: enabled && !!serviceId && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
