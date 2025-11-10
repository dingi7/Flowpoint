import {
  AppointmentRepository,
  CalendarRepository,
  LoggerService,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { generateTimeslotsForDate } from "../availability/generate-timeslots-for-date";

interface Payload {
  serviceId: string;
  date: string;
  organizationId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  calendarRepository: CalendarRepository;
  loggerService: LoggerService;
  timeOffRepository: TimeOffRepository;
  appointmentRepository: AppointmentRepository;
}

export async function getAvailableTimeslotsApiFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { serviceId, date, organizationId } = payload;
  const {
    serviceRepository,
    calendarRepository,
    loggerService,
    timeOffRepository,
    appointmentRepository,
  } = dependencies;

  loggerService.info("getAvailableTimeslotsApiFn", {
    serviceId,
    date,
    organizationId,
  });

  const service = await serviceRepository.get({
    id: serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.error("Service not found", { serviceId });
    throw new Error("Service not found");
  }

  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: service.ownerId },
    ],
    organizationId,
  });

  if (!calendars || calendars.length === 0) {
    loggerService.error("Calendar not found", {
      calendarOwnerId: service.ownerId,
    });
    throw new Error("Calendar not found");
  }

  const calendar = calendars[0];

  const timeOffs = await timeOffRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: service.ownerId },
    ],
    organizationId,
  });

  const existingAppointments = await appointmentRepository.getAll({
    queryConstraints: [
      { field: "calendarId", operator: "==", value: calendar.id },
    ],
    organizationId,
  });

  const timeslots = generateTimeslotsForDate(
    {
      date: new Date(date),
      calendar,
      serviceDuration: service.duration,
      existingAppointments,
      timeOffs,
    },
    {
      loggerService,
    },
  );

  return timeslots;
}

