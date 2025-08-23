import { getAvailableTimeslotsFn } from "@/app/availability/get-available-timeslots";
import {
  APPOINTMENT_STATUS,
  AppointmentRepository,
  ASSIGNEE_TYPE,
  CalendarRepository,
  Customer,
  CustomerRepository,
  LoggerService,
  Service,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { validateBookingRequest } from "./validation/booking-validation";

interface Payload {
  serviceId: string;
  customerId: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  assigneeType: ASSIGNEE_TYPE;
  fee?: number;
  title?: string;
  description?: string;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  serviceRepository: ServiceRepository;
  customerRepository: CustomerRepository;
  calendarRepository: CalendarRepository;
  timeOffRepository: TimeOffRepository;
  loggerService: LoggerService;
}

interface BookingResult {
  appointmentId: string;
  confirmationDetails: {
    service: Service;
    customer: Customer;
    startTime: string;
    endTime: string;
    duration: number;
    fee?: number;
  };
}

/**
 * Comprehensive appointment booking function
 */
export async function bookAppointmentFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<BookingResult> {
  const {
    appointmentRepository,
    serviceRepository,
    customerRepository,
    calendarRepository,
    timeOffRepository,
    loggerService,
  } = dependencies;

  loggerService.info("Starting appointment booking process", {
    serviceId: payload.serviceId,
    customerId: payload.customerId,
    startTime: payload.startTime,
  });

  // 1. Comprehensive validation
  const validationResult = await validateBookingRequest(payload, {
    serviceRepository,
    customerRepository,
    calendarRepository,
    appointmentRepository,
    timeOffRepository,
  });

  const { validatedPayload, service, customer, calendar, startTime, endTime } =
    validationResult;

  // 2. Double-check availability using existing utility
  const availableSlots = await getAvailableTimeslotsFn(
    {
      serviceId: validatedPayload.serviceId,
      date: startTime.toISOString().split("T")[0],
      organizationId: validatedPayload.organizationId,
    },
    {
      serviceRepository,
      calendarRepository,
      loggerService,
      timeOffRepository,
      appointmentRepository,
    },
  );

  // Check if requested time is in available slots
  const requestedSlot = availableSlots.find((slot) => {
    const slotStart = new Date(slot.start);
    return Math.abs(slotStart.getTime() - startTime.getTime()) < 60000; // Within 1 minute
  });

  if (!requestedSlot) {
    throw new Error("Requested time slot is no longer available");
  }

  // 3. Create appointment
  const appointmentData = {
    assigneeType: validatedPayload.assigneeType,
    assigneeId: validatedPayload.assigneeId,
    customerId: validatedPayload.customerId,
    serviceId: validatedPayload.serviceId,
    calendarId: calendar.id,
    title: validatedPayload.title || service.name,
    description:
      validatedPayload.description || `Appointment for ${service.name}`,
    organizationId: validatedPayload.organizationId,
    startTime: startTime.toISOString(),
    duration: service.duration,
    fee: validatedPayload.fee ?? service.price,
    status: APPOINTMENT_STATUS.PENDING,
  };

  const appointmentId = await appointmentRepository.create({
    data: appointmentData,
    organizationId: validatedPayload.organizationId,
  });

  loggerService.info("Appointment created successfully", {
    appointmentId,
    customerId: customer.id,
    serviceId: service.id,
  });

  // 4. Prepare confirmation details
  const confirmationDetails = {
    service,
    customer,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: service.duration,
    fee: appointmentData.fee,
  };

  return {
    appointmentId,
    confirmationDetails,
  };
}
