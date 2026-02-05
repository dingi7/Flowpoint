import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/app/context/TenantContext";

const databaseService = serviceHost.getDatabaseService();

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

export const useOrganization = () => {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["organization", "get", organizationId],
    queryFn: () =>
      organizationRepository.get({
        id: organizationId,
      }),
    enabled: !!organizationId,
  });
};
