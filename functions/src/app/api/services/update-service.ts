import {
  LoggerService,
  ServiceData,
  ServiceRepository,
  serviceDataSchema,
} from "@/core";

interface Payload {
  organizationId: string;
  serviceId: string;
  data: Partial<Omit<ServiceData, "organizationId">>;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function updateServiceApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, serviceId, data } = payload;
  const { serviceRepository, loggerService } = dependencies;

  loggerService.info("Updating service via API", {
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

  // Validate updated data (merge with existing)
  const updatedData = serviceDataSchema.partial().parse({
    ...data,
    organizationId, // Ensure organizationId is preserved
  });

  await serviceRepository.update({
    id: serviceId,
    data: updatedData,
    organizationId,
  });

  loggerService.info("Service updated successfully", {
    serviceId,
    organizationId,
  });
}

