import {
  Appointment,
  AppointmentRepository,
  LoggerService,
} from "@/core";

interface Payload {
  organizationId: string;
  filters?: {
    serviceId?: string;
    customerId?: string;
    assigneeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  loggerService: LoggerService;
}

export async function listAppointmentsApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<Appointment[]> {
  const { organizationId, filters } = payload;
  const { appointmentRepository, loggerService } = dependencies;

  loggerService.info("Listing appointments via API", {
    organizationId,
    filters,
  });

  const queryConstraints = [];

  if (filters?.serviceId) {
    queryConstraints.push({
      field: "serviceId",
      operator: "==" as const,
      value: filters.serviceId,
    });
  }

  if (filters?.customerId) {
    queryConstraints.push({
      field: "customerId",
      operator: "==" as const,
      value: filters.customerId,
    });
  }

  if (filters?.assigneeId) {
    queryConstraints.push({
      field: "assigneeId",
      operator: "==" as const,
      value: filters.assigneeId,
    });
  }

  if (filters?.status) {
    queryConstraints.push({
      field: "status",
      operator: "==" as const,
      value: filters.status,
    });
  }

  if (filters?.startDate) {
    queryConstraints.push({
      field: "startTime",
      operator: ">=" as const,
      value: filters.startDate,
    });
  }

  if (filters?.endDate) {
    queryConstraints.push({
      field: "startTime",
      operator: "<=" as const,
      value: filters.endDate,
    });
  }

  const appointments = await appointmentRepository.getAll({
    queryConstraints,
    organizationId,
  });

  return appointments;
}

