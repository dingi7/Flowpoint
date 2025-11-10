import {
  LoggerService,
  ServiceData,
  ServiceRepository,
  serviceDataSchema,
} from "@/core";

interface Payload {
  organizationId: string;
  data: Omit<ServiceData, "organizationId">;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function createServiceApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<string> {
  const { organizationId, data } = payload;
  const { serviceRepository, loggerService } = dependencies;

  loggerService.info("Creating service via API", {
    organizationId,
    serviceName: data.name,
  });

  // Validate service data
  const validatedData = serviceDataSchema.parse({
    ...data,
    organizationId,
  });

  const serviceId = await serviceRepository.create({
    data: validatedData,
    organizationId,
  });

  loggerService.info("Service created successfully", {
    serviceId,
    organizationId,
  });

  return serviceId;
}

