import {
  APPOINTMENT_STATUS,
  AppointmentRepository,
  ASSIGNEE_TYPE,
  CalendarRepository, CustomerRepository,
  LoggerService,
  OrganizationRepository,
  Service,
  ServiceRepository,
  TimeOffRepository
} from "@/core";
import { validateBookingRequest } from "./validation/booking-validation";

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  assigneeType: ASSIGNEE_TYPE;
  fee?: number;
  title?: string;
  description?: string;
  customerData?: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
    customFields?: Record<string, unknown>;
  };
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  serviceRepository: ServiceRepository;
  customerRepository: CustomerRepository;
  calendarRepository: CalendarRepository;
  timeOffRepository: TimeOffRepository;
  loggerService: LoggerService;
  organizationRepository: OrganizationRepository;
}

interface BookingResult {
  appointmentId: string;
  confirmationDetails: {
    service: Service;
    customerId: string;
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
    organizationRepository
  } = dependencies;

  loggerService.info("Starting appointment booking process", {
    serviceId: payload.serviceId,
    customerEmail: payload.customerEmail,
    startTime: payload.startTime,
  });

  // 1. Comprehensive validation
  const validationResult = await validateBookingRequest(payload, {
    serviceRepository,
    customerRepository,
    calendarRepository,
    appointmentRepository,
    timeOffRepository,
    loggerService,
    organizationRepository,
  });

  const { validatedPayload, service, customerId, calendar, startTime, endTime } =
    validationResult;

  // 2. Create appointment
  const appointmentData = {
    assigneeType: validatedPayload.assigneeType,
    assigneeId: validatedPayload.assigneeId,
    customerId,
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
    customerId,
    serviceId: service.id,
  });

  // 4. Prepare confirmation details
  const confirmationDetails = {
    service,
    customerId,
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
