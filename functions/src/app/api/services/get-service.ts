import { LoggerService, Service, ServiceRepository } from "@/core";

interface Payload {
  organizationId: string;
  serviceId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function getServiceApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<Service | null> {
  const { organizationId, serviceId } = payload;
  const { serviceRepository, loggerService } = dependencies;

  loggerService.info("Getting service via API", {
    organizationId,
    serviceId,
  });

  const service = await serviceRepository.get({
    id: serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.info("Service not found", { serviceId, organizationId });
    return null;
  }

  return service;
}

