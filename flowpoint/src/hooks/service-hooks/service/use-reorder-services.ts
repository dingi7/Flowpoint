import { Service } from "@/core";
import { useUpdateService } from "@/hooks/repository-hooks/service/use-service";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useCallback } from "react";
import { toast } from "sonner";

export function useReorderServices() {
  const updateServiceMutation = useUpdateService();
  const currentOrganizationId = useCurrentOrganizationId();

  const reorderServices = useCallback(
    async (services: Service[]) => {
      if (!currentOrganizationId) {
        toast.error("No organization selected");
        return;
      }

      try {
        // Update each service with its new order
        const updatePromises = services.map((service, index) =>
          updateServiceMutation.mutateAsync({
            id: service.id,
            data: {
              ...service,
              order: index,
            },
            organizationId: currentOrganizationId,
          }),
        );

        await Promise.all(updatePromises);
        toast.success("Services reordered successfully");
      } catch (error) {
        console.error("Failed to reorder services:", error);
        toast.error("Failed to reorder services");
      }
    },
    [updateServiceMutation, currentOrganizationId],
  );

  return {
    reorderServices,
    isReordering: updateServiceMutation.isPending,
  };
}
