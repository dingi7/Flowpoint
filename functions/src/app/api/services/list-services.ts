import { LoggerService, Service, ServiceRepository } from "@/core";

interface Payload {
  organizationId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function listServicesApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<Service[]> {
  const { organizationId } = payload;
  const { serviceRepository, loggerService } = dependencies;

  loggerService.info("Listing services via API", { organizationId });

  const services = await serviceRepository.getAll({
    queryConstraints: [
      {
        field: "organizationId",
        operator: "==",
        value: organizationId,
      },
    ],
    organizationId,
  });

  return services;
}

