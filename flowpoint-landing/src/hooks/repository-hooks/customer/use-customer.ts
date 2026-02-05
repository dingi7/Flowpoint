import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";
import { useTenant } from "@/app/context/TenantContext";

const databaseService = serviceHost.getDatabaseService();

const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);

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
      queryClient.invalidateQueries({ queryKey: ["organizations", "get"] });
    },
  });
};

export const useCustomerByEmail = (email: string) => {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["customer", "get", email, organizationId],
    queryFn: () =>
      customerRepository.getAll({
        queryConstraints: [{ field: "email", operator: "==", value: email }],
        organizationId,
      }),
    enabled: !!email && !!organizationId,
  });
};

export const useCustomers = (options: GetOptions) => {
  const { organizationId } = useTenant();

  return useInfiniteQuery({
    queryKey: [
      "customers",
      "get",
      JSON.stringify(options),
      organizationId,
    ],
    queryFn: ({ pageParam }) =>
      customerRepository.getAll({
        ...options,
        organizationId,
        pagination: {
          ...options.pagination,
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options),
    enabled: !!organizationId,
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
};

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
};
