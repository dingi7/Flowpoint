import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

export interface RevokeApiKeyParams {
  organizationId: string;
  secretId: string;
}

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RevokeApiKeyParams>({
    mutationKey: ["revokeApiKey"],
    mutationFn: async (params: RevokeApiKeyParams) => {
      return functionsService.revokeApiKey(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate all organization-related queries to refresh API keys list
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });

      // Invalidate specific organization query
      queryClient.invalidateQueries({
        queryKey: ["organization", "get", variables.organizationId],
      });

      // Invalidate organizations by IDs queries (this is what UserInitializer uses)
      queryClient.invalidateQueries({
        queryKey: ["organizations", "getMany"],
      });
    },
  });
};
