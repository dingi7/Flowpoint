import { useTenant } from "@/app/context/TenantContext";
import {
  GenerateHairstylePreviewPayload,
  GenerateHairstylePreviewResponse,
} from "@/core";
import { serviceHost } from "@/services";
import { useMutation } from "@tanstack/react-query";

const functionsService = serviceHost.getFunctionsService();

type GenerateHairstylePreviewVariables = Omit<
  GenerateHairstylePreviewPayload,
  "organizationId"
>;

export function useGenerateHairstylePreview() {
  const { organizationId } = useTenant();

  return useMutation<
    GenerateHairstylePreviewResponse,
    Error,
    GenerateHairstylePreviewVariables
  >({
    mutationFn: async (payload) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return functionsService.generateHairstylePreview({
        ...payload,
        organizationId,
      });
    },
  });
}
