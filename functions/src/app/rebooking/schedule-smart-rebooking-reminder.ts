import {
  APPOINTMENT_STATUS,
  Appointment,
  AppointmentRepository,
  CloudTasksService,
  GenkitService,
  LoggerService,
  ServiceRepository,
} from "@/core";
import { calculateRebookingSuggestion } from "./calculate-rebooking-suggestion";

interface Payload {
  appointment: Appointment;
  organizationId: string;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  cloudTasksServiceRebooking: CloudTasksService;
  genkitService?: GenkitService;
  loggerService: LoggerService;
  serviceRepository: ServiceRepository;
}

function getFutureScheduleTime(payload: { suggestedDate: string }): Date {
  const suggestedDate = new Date(payload.suggestedDate);
  const now = new Date();

  if (suggestedDate > now) {
    return suggestedDate;
  }

  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

export async function scheduleSmartRebookingReminderFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const {
    appointmentRepository,
    cloudTasksServiceRebooking,
    genkitService,
    loggerService,
    serviceRepository,
  } = dependencies;
  const { appointment, organizationId } = payload;

  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    return;
  }

  const service = await serviceRepository.get({
    id: appointment.serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.warn("Skipping smart rebooking reminder; service not found", {
      appointmentId: appointment.id,
      serviceId: appointment.serviceId,
      organizationId,
    });
    return;
  }

  const customerAppointments = await appointmentRepository.getAll({
    organizationId,
    queryConstraints: [{ field: "customerId", operator: "==", value: appointment.customerId }],
    pagination: { limit: 20 },
    orderBy: { field: "startTime", direction: "desc" },
  });

  const latestNonCancelled = customerAppointments.find(
    (item) => item.status !== APPOINTMENT_STATUS.CANCELLED,
  );

  if (latestNonCancelled && latestNonCancelled.id !== appointment.id) {
    loggerService.info("Skipping smart rebooking reminder; newer appointment exists", {
      appointmentId: appointment.id,
      latestAppointmentId: latestNonCancelled.id,
      customerId: appointment.customerId,
    });
    return;
  }

  const suggestion = await calculateRebookingSuggestion({
    appointment,
    customerAppointments,
    service,
    genkitService,
  });
  const scheduleTime = getFutureScheduleTime({
    suggestedDate: suggestion.suggestedDate,
  });

  await cloudTasksServiceRebooking.scheduleTask({
    payload: {
      appointmentId: appointment.id,
      organizationId,
      suggestedRebookingDate: suggestion.suggestedDate,
      rebookingReason: suggestion.reason,
    },
    scheduleTime,
  });

  loggerService.info("Smart rebooking reminder scheduled", {
    appointmentId: appointment.id,
    organizationId,
    scheduleTime: scheduleTime.toISOString(),
    intervalDays: suggestion.intervalDays,
    source: suggestion.source,
  });
}
