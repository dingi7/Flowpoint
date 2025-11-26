import {
  AppointmentRepository,
  CalendarRepository,
  LoggerService,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { generateTimeslotsForDate } from "./generate-timeslots-for-date";

interface Payload {
  serviceId: string;
  date: string;
  organizationId: string;
  assigneeId: string;
}

interface Dependencies {
  serviceRepository: ServiceRepository;
  calendarRepository: CalendarRepository;
  loggerService: LoggerService;
  timeOffRepository: TimeOffRepository;
  appointmentRepository: AppointmentRepository;
}

/**
 * Get available timeslots for a service on a specific date
 *
 * @param {Payload} payload
 * @param {Dependencies} dependencies
 *
 * @return {*}  {Promise<TimeSlot[]>}
 */
export async function getAvailableTimeslotsFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { serviceId, date, organizationId, assigneeId } = payload;
  const {
    serviceRepository,
    calendarRepository,
    loggerService,
    timeOffRepository,
    appointmentRepository,
  } = dependencies;

  loggerService.info("getAvailableTimeslotsFn", { serviceId, date, organizationId });

  const service = await serviceRepository.get({
    id: serviceId,
    organizationId,
  });
  loggerService.info("service", service);
  if (!service) {
    loggerService.error("Service not found", { serviceId });
    throw new Error("Service not found");
  }

  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: assigneeId },
    ],
    organizationId,
  });
  if (!calendars || calendars.length === 0) {
    loggerService.error("Calendar not found", {
      calendarOwnerId: assigneeId,
    });
    throw new Error("Calendar not found");
  }
  const calendar = calendars[0];
  loggerService.info("calendar", calendar);

  const timeOffs = await timeOffRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: assigneeId },
    ],
    organizationId,
  });

  const existingAppointments = await appointmentRepository.getAll({
    queryConstraints: [
      { field: "calendarId", operator: "==", value: calendar.id },
    ],
    organizationId,
  });

  loggerService.info("existingAppointments", existingAppointments);

  loggerService.info("timeOffs", timeOffs);


  const timeslots = generateTimeslotsForDate({
    date: new Date(date),
    calendar,
    serviceDuration: service.duration,
    existingAppointments,
    timeOffs,
  }, {
    loggerService,
  });

  loggerService.info("timeslots", timeslots);

  return timeslots;
}
