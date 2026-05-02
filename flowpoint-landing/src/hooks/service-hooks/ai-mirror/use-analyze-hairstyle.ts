import { useTenant } from "@/app/context/TenantContext";
import { AnalyzeHairstylePayload, AnalyzeHairstyleResponse } from "@/core";
import { serviceHost } from "@/services";
import { useMutation } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

type AnalyzeHairstyleVariables = Omit<
  AnalyzeHairstylePayload,
  "organizationId"
>;

export function useAnalyzeHairstyle() {
  const { organizationId } = useTenant();

  return useMutation<AnalyzeHairstyleResponse, Error, AnalyzeHairstyleVariables>({
    mutationFn: async (payload) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return functionsService.analyzeHairstyle({
        ...payload,
        organizationId,
      });
    },
  });
}
