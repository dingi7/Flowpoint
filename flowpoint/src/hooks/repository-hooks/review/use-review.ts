import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const reviewRepository = repositoryHost.getReviewRepository(databaseService);

type CreateReviewParams = Parameters<typeof reviewRepository.create>[0];

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateReviewParams) => reviewRepository.create(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.organizationId],
      });
      // Invalidate appointment-specific reviews query
      queryClient.invalidateQueries({
        queryKey: [
          "reviews",
          "appointment",
          variables.data.appointmentId,
          variables.organizationId,
        ],
      });
    },
  });
};

export const useReview = (id: string, organizationId?: string) => {
  const currentOrganizationId = useCurrentOrganizationId();
  const orgId = organizationId || currentOrganizationId;

  return useQuery({
    queryKey: ["review", "get", id, orgId],
    queryFn: () =>
      reviewRepository.get({
        id,
        organizationId: orgId!,
      }),
    enabled: !!id && !!orgId,
  });
};

export const useReviews = (options: GetOptions = {}) => {
  const currentOrganizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: [
      "reviews",
      "get",
      JSON.stringify(options),
      currentOrganizationId,
    ],
    queryFn: ({ pageParam }) =>
      reviewRepository.getAll({
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

export const useReviewsByAppointment = (
  appointmentId: string,
  organizationId?: string,
) => {
  const currentOrganizationId = useCurrentOrganizationId();
  const orgId = organizationId || currentOrganizationId;

  return useQuery({
    queryKey: ["reviews", "appointment", appointmentId, orgId],
    queryFn: () =>
      reviewRepository.getAll({
        organizationId: orgId!,
        queryConstraints: [
          { field: "appointmentId", operator: "==", value: appointmentId },
        ],
      }),
    enabled: !!appointmentId && !!orgId,
  });
};

