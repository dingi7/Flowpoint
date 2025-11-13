import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceHost } from "@/services";

const functionsService = serviceHost.getFunctionsService();

export interface CreateApiKeyParams {
  organizationId: string;
  name: string;
}

export interface CreateApiKeyResponse {
  apiKey: string;
  apiKeyMetadata: {
    name: string;
    secretId: string;
    createdAt: Date;
    status: "active" | "revoked";
    lastFour: string;
  };
}

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateApiKeyResponse, Error, CreateApiKeyParams>({
    mutationKey: ["createApiKey"],
    mutationFn: async (params: CreateApiKeyParams) => {
      return functionsService.createApiKey(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate all organization-related queries to refresh API keys list
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      
      // Invalidate specific organization query
      queryClient.invalidateQueries({ 
        queryKey: ["organization", "get", variables.organizationId] 
      });
      
      // Invalidate organizations by IDs queries (this is what UserInitializer uses)
      queryClient.invalidateQueries({ 
        queryKey: ["organizations", "getMany"] 
      });
    },
  });
};

