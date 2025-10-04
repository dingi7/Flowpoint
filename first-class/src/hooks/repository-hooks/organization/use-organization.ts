import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { ORGANIZATION_ID } from "@/constants";

const databaseService = serviceHost.getDatabaseService();

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

export const useOrganization = () => {
  const currentOrganizationId = ORGANIZATION_ID;

  return useQuery({
    queryKey: ["organization", "get", currentOrganizationId],
    queryFn: () =>
      organizationRepository.get({
        id: currentOrganizationId!,
      }),
    enabled: !!currentOrganizationId,
  });
};
