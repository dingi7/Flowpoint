import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

interface SetAiMirrorGeminiKeyParams {
  organizationId: string;
  geminiApiKey: string;
}

interface SetAiMirrorGeminiKeyResponse {
  hasGeminiKey: boolean;
}

export function useSetAiMirrorGeminiKey() {
  const queryClient = useQueryClient();

  return useMutation<
    SetAiMirrorGeminiKeyResponse,
    Error,
    SetAiMirrorGeminiKeyParams
  >({
    mutationKey: ["setAiMirrorGeminiKey"],
    mutationFn: async (params) => {
      return functionsService.setAiMirrorGeminiKey(params);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({
        queryKey: ["organization", "get", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["organizations", "getMany"],
      });
    },
  });
}
