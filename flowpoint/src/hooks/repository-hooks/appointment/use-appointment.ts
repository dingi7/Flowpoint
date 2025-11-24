import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getDateRangeForQuery } from "@/utils/date-time";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

type CreateAppointmentParams = Parameters<
  typeof appointmentRepository.create
>[0];
type UpdateAppointmentParams = Parameters<
  typeof appointmentRepository.update
>[0];
type DeleteAppointmentParams = Parameters<
  typeof appointmentRepository.delete
>[0];

export function useAppointments(options?: GetOptions) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["appointments", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        ...(options || {}),
        pagination: {
          ...(options?.pagination || {}),
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options || {}),
    enabled: !!organizationId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateAppointmentParams>({
    mutationKey: ["appointment", "create"],
    mutationFn: async (params: CreateAppointmentParams) => {
      return appointmentRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "get"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateAppointmentParams>({
    mutationKey: ["appointment", "update"],
    mutationFn: async (params: UpdateAppointmentParams) => {
      return appointmentRepository.update(params);
    },
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteAppointmentParams>({
    mutationKey: ["appointment", "delete"],
    mutationFn: async (params: DeleteAppointmentParams) => {
      return appointmentRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useGetAllAppointments() {
  const organizationId = useCurrentOrganizationId();
  return useQuery({
    queryKey: ["appointments", "all", organizationId],
    queryFn: () =>
      appointmentRepository.getAll({ organizationId: organizationId! }),
    enabled: !!organizationId,
  });
}

/**
 * Hook to get appointments for a specific date using query constraints
 * @param date - The date to query appointments for (will be normalized to local midnight)
 * @returns Query result with appointments for the specified date
 */
export function useGetAppointmentsByDate(date: Date) {
  const organizationId = useCurrentOrganizationId();

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);

  const { startOfDay, endOfDay } = getDateRangeForQuery(normalizedDate);

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["appointments", "byDate", organizationId, dateKey],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "startTime", operator: ">=", value: startOfDay },
          { field: "startTime", operator: "<=", value: endOfDay },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId,
  });
}

export function useGetAppointmentsByAssignee(assigneeId: string) {
  const organizationId = useCurrentOrganizationId();
  return useQuery({
    queryKey: ["appointments", "byAssignee", organizationId, assigneeId],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "assigneeId", operator: "==", value: assigneeId },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId && !!assigneeId,
  });
}

export function useGetAppointmentsByAssigneeAndDate(
  assigneeId: string,
  date: Date,
) {
  const organizationId = useCurrentOrganizationId();

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);

  const { startOfDay, endOfDay } = getDateRangeForQuery(normalizedDate);

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return useQuery({
    queryKey: [
      "appointments",
      "byAssignee",
      organizationId,
      assigneeId,
      dateKey,
    ],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "assigneeId", operator: "==", value: assigneeId },
          { field: "startTime", operator: ">=", value: startOfDay },
          { field: "startTime", operator: "<=", value: endOfDay },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "asc" },
      }),
    enabled: !!organizationId && !!assigneeId,
  });
}

/**
 * Hook to get appointments for a specific customer
 * @param customerId - The ID of the customer
 * @returns Query result with appointments for the specified customer
 */
export function useGetAppointmentsByCustomer(customerId: string) {
  const organizationId = useCurrentOrganizationId();

  return useQuery({
    queryKey: ["appointments", "byCustomer", organizationId, customerId],
    queryFn: () =>
      appointmentRepository.getAll({
        organizationId: organizationId!,
        queryConstraints: [
          { field: "customerId", operator: "==", value: customerId },
        ],
        pagination: { limit: 1000 },
        orderBy: { field: "startTime", direction: "desc" },
      }),
    enabled: !!organizationId && !!customerId,
  });
}

/**
 * Hook to search appointments by title, description, or customer name/email
 * Uses Firestore prefix matching and client-side filtering for comprehensive search
 * @param searchQuery - The search query string
 * @param limit - Maximum number of results to return (default: 20)
 */
export function useSearchAppointments(searchQuery: string, limit: number = 20) {
  const organizationId = useCurrentOrganizationId();
  const trimmedQuery = searchQuery.trim().toLowerCase();

  return useQuery({
    queryKey: ["appointments", "search", trimmedQuery, organizationId, limit],
    queryFn: async () => {
      if (!trimmedQuery || !organizationId) {
        return [];
      }

      const customerRepository =
        repositoryHost.getCustomerRepository(databaseService);
      const allResults: Set<string> = new Set(); // Track appointment IDs to avoid duplicates
      const appointmentResults: any[] = [];

      // 1. Search by appointment title
      const titleResults = await appointmentRepository.getAll({
        organizationId: organizationId,
        queryConstraints: [
          { field: "title", operator: ">=", value: trimmedQuery },
          { field: "title", operator: "<=", value: trimmedQuery + "\uf8ff" },
        ],
        pagination: { limit },
        orderBy: { field: "title", direction: "asc" },
      });

      // Add title matches with client-side filtering for description too
      titleResults.forEach((appointment) => {
        const titleMatch = appointment.title
          .toLowerCase()
          .includes(trimmedQuery);
        const descriptionMatch = appointment.description
          ?.toLowerCase()
          .includes(trimmedQuery);
        if (
          (titleMatch || descriptionMatch) &&
          !allResults.has(appointment.id)
        ) {
          allResults.add(appointment.id);
          appointmentResults.push(appointment);
        }
      });

      // 2. Search by customer name
      const customersByName = await customerRepository.getAll({
        organizationId: organizationId,
        queryConstraints: [
          { field: "name", operator: ">=", value: trimmedQuery },
          { field: "name", operator: "<=", value: trimmedQuery + "\uf8ff" },
        ],
        pagination: { limit: 10 },
      });

      // 3. Search by customer email
      const customersByEmail = await customerRepository.getAll({
        organizationId: organizationId,
        queryConstraints: [
          { field: "email", operator: ">=", value: trimmedQuery },
          { field: "email", operator: "<=", value: trimmedQuery + "\uf8ff" },
        ],
        pagination: { limit: 10 },
      });

      // Combine and deduplicate customers
      const allCustomers = new Map();
      [...customersByName, ...customersByEmail].forEach((customer) => {
        if (
          customer.name.toLowerCase().includes(trimmedQuery) ||
          customer.email.toLowerCase().includes(trimmedQuery)
        ) {
          allCustomers.set(customer.id, customer);
        }
      });

      // 4. Fetch appointments for matching customers
      const customerIds = Array.from(allCustomers.keys());
      for (const customerId of customerIds) {
        const customerAppointments = await appointmentRepository.getAll({
          organizationId: organizationId,
          queryConstraints: [
            { field: "customerId", operator: "==", value: customerId },
          ],
          pagination: { limit: 5 }, // Limit per customer to avoid too many results
          orderBy: { field: "startTime", direction: "desc" },
        });

        customerAppointments.forEach((appointment) => {
          if (!allResults.has(appointment.id)) {
            allResults.add(appointment.id);
            appointmentResults.push(appointment);
          }
        });
      }

      // Return limited results, sorted by start time (most recent first)
      return appointmentResults
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        )
        .slice(0, limit);
    },
    enabled: !!organizationId && trimmedQuery.length >= 2,
  });
}
