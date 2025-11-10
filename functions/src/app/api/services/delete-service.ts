import { LoggerService, ServiceRepository } from "@/core";

interface Payload {
  organizationId: string;
  serviceId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function deleteServiceApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, serviceId } = payload;
  const { serviceRepository, loggerService } = dependencies;

  loggerService.info("Deleting service via API", {
    organizationId,
    serviceId,
  });

  // Verify service exists and belongs to organization
  const existingService = await serviceRepository.get({
    id: serviceId,
    organizationId,
  });

  if (!existingService) {
    loggerService.info("Service not found", { serviceId, organizationId });
    throw new Error("Service not found");
  }

  await serviceRepository.delete({
    id: serviceId,
    organizationId,
  });

  loggerService.info("Service deleted successfully", {
    serviceId,
    organizationId,
  });
}

