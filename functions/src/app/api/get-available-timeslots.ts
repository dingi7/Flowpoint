import {
  AppointmentRepository,
  CalendarRepository,
  LoggerService,
  PricingRuleRepository,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { generateTimeslotsForDate } from "../availability/generate-timeslots-for-date";
import { calculatePriceQuote } from "@/app/pricing/calculate-price";

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
  pricingRuleRepository: PricingRuleRepository;
}

function getUtcDayBounds(dateValue: string) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date");
  }

  const year = parsedDate.getUTCFullYear();
  const month = parsedDate.getUTCMonth();
  const day = parsedDate.getUTCDate();

  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const startOfNextDay = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  return {
    parsedDate,
    startOfDayIso: startOfDay.toISOString(),
    startOfNextDayIso: startOfNextDay.toISOString(),
    endOfDayIso: endOfDay.toISOString(),
  };
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
    pricingRuleRepository,
  } = dependencies;

  loggerService.info("getAvailableTimeslotsApiFn", {
    serviceId,
    date,
    organizationId,
  });
  const { parsedDate, startOfDayIso, startOfNextDayIso, endOfDayIso } =
    getUtcDayBounds(date);

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
    pagination: { limit: 1 },
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
      { field: "endAt", operator: ">=", value: startOfDayIso },
    ],
    organizationId,
  });

  const existingAppointments = await appointmentRepository.getAll({
    queryConstraints: [
      { field: "calendarId", operator: "==", value: calendar.id },
      { field: "startTime", operator: ">=", value: startOfDayIso },
      { field: "startTime", operator: "<", value: startOfNextDayIso },
    ],
    organizationId,
  });

  const pricingRules = await pricingRuleRepository.getAll({
    queryConstraints: [{ field: "active", operator: "==", value: true }],
    organizationId,
  });

  const timeslots = generateTimeslotsForDate(
    {
      date: parsedDate,
      calendar,
      serviceDuration: service.duration,
      existingAppointments,
      timeOffs: timeOffs.filter((timeOff) => timeOff.startAt <= endOfDayIso),
    },
    {
      loggerService,
    },
  );

  return timeslots.map((timeslot) => ({
    ...timeslot,
    ...calculatePriceQuote({
      service,
      startTime: new Date(timeslot.start),
      assigneeId: service.ownerId,
      pricingRules,
    }),
  }));
}
