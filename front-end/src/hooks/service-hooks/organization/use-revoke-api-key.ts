import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceHost } from "@/services";

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
      // Invalidate organization queries to refresh API keys list
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ 
        queryKey: ["organization", "get", variables.organizationId] 
      });
    },
  });
};

