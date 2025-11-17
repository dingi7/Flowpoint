import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();

const customerRepository = repositoryHost.getCustomerRepository(databaseService);

type CreateCustomerParams = Parameters<typeof customerRepository.create>[0];
type UpdateCustomerParams = Parameters<typeof customerRepository.update>[0];
type DeleteCustomerParams = Parameters<typeof customerRepository.delete>[0];

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateCustomerParams>({
    mutationKey: ["customer", "create"],
    mutationFn: async (params: CreateCustomerParams) => {
      return customerRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "get"] });
    },
  });
};

export const useCustomer = (id: string) => {
  const currentOrganizationId = useCurrentOrganizationId();
  
  return useQuery({
    queryKey: ["customer", "get", id, currentOrganizationId],
    queryFn: () => customerRepository.get({
      id,
      organizationId: currentOrganizationId!,
    }),
    enabled: !!id && !!currentOrganizationId,
  });
};

export const useCustomers = (options: GetOptions) => {
  const currentOrganizationId = useCurrentOrganizationId();
  
  return useInfiniteQuery({
    queryKey: ["customers", "get", JSON.stringify(options), currentOrganizationId],
    queryFn: ({ pageParam }) =>
      customerRepository.getAll({
        ...options,
        organizationId: currentOrganizationId!,
        pagination: {
          ...options.pagination,
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options),
    enabled: !!currentOrganizationId,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateCustomerParams>({
    mutationKey: ["customer", "update"],
    mutationFn: async (params: UpdateCustomerParams) => {
      return customerRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "get"] });
    },
  });
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteCustomerParams>({
    mutationKey: ["customer", "delete"],
    mutationFn: async (params: DeleteCustomerParams) => {
      return customerRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "get"] });
    },
  });
}

/**
 * Hook to search customers by name
 * Uses client-side filtering for case-insensitive matching
 * @param searchQuery - The search query string (searches by name, email, or phone)
 * @param limit - Maximum number of results to return (default: 20)
 */
export const useSearchCustomers = (searchQuery: string, limit: number = 20) => {
  const currentOrganizationId = useCurrentOrganizationId();
  const trimmedQuery = searchQuery.trim();
  const lowerQuery = trimmedQuery.toLowerCase();

  return useQuery({
    queryKey: ["customers", "search", trimmedQuery, currentOrganizationId, limit],
    queryFn: async () => {
      if (!trimmedQuery || !currentOrganizationId) {
        return [];
      }

      // Fetch a larger batch to account for case-insensitive filtering
      // Firestore doesn't support case-insensitive queries, so we fetch more and filter client-side
      const fetchLimit = Math.max(limit * 10, 200);
      
      // Use the original query (not lowercased) for Firestore prefix matching
      // This will catch names that start with the same case
      const results = await customerRepository.getAll({
        organizationId: currentOrganizationId,
        queryConstraints: [
          { field: "name", operator: ">=", value: trimmedQuery },
          { field: "name", operator: "<=", value: trimmedQuery + "\uf8ff" },
        ],
        pagination: { limit: fetchLimit },
        orderBy: { field: "name", direction: "asc" },
      });

      // Also fetch with lowercase to catch names stored in different cases
      // This is a workaround for Firestore's case-sensitive queries
      const lowerResults = trimmedQuery !== lowerQuery
        ? await customerRepository.getAll({
            organizationId: currentOrganizationId,
            queryConstraints: [
              { field: "name", operator: ">=", value: lowerQuery },
              { field: "name", operator: "<=", value: lowerQuery + "\uf8ff" },
            ],
            pagination: { limit: fetchLimit },
            orderBy: { field: "name", direction: "asc" },
          })
        : [];

      // Combine and deduplicate results
      const allResults = [...results, ...lowerResults];
      const uniqueResults = Array.from(
        new Map(allResults.map((customer) => [customer.id, customer])).values()
      );

      // Client-side filtering for case-insensitive matching (name, email, phone)
      const filtered = uniqueResults.filter((customer) => {
        const nameMatch = customer.name.toLowerCase().includes(lowerQuery);
        const emailMatch = customer.email.toLowerCase().includes(lowerQuery);
        const phoneMatch = customer.phone?.toLowerCase().includes(lowerQuery);
        return nameMatch || emailMatch || phoneMatch;
      });

      // Return limited results, sorted by relevance (exact name matches first)
      return filtered
        .sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
          const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, limit);
    },
    enabled: !!currentOrganizationId && trimmedQuery.length >= 2,
  });
}
