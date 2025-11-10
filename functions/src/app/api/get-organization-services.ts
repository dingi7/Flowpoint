import { ServiceRepository } from "@/core";

interface Payload {
  organizationId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
}

export async function getOrganizationServicesApiFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { organizationId } = payload;
  const { serviceRepository } = dependencies;

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

