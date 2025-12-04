import {
  APPOINTMENT_STATUS,
  AppointmentData,
  AppointmentRepository,
  CalendarRepository,
  CloudTasksService,
  CustomerRepository,
  LoggerService,
  MailgunService,
  MemberRepository,
  OrganizationRepository,
  Service,
  ServiceRepository,
  TimeOffRepository,
  UserRepository,
} from "@/core";
import { sendAppointmentEmailNotificationFn } from "../notification/send-appointment-email-notification";
import { validateBookingRequest } from "./validation/booking-validation";

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  fee?: number;
  title?: string;
  description?: string;
  timezone?: string;
  customerData: {
    name: string;
    phone: string;
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
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  loggerService: LoggerService;
  organizationRepository: OrganizationRepository;
  mailgunService: MailgunService;
  cloudTasksService: CloudTasksService;
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
    organizationRepository,
  } = dependencies;

  loggerService.info("Starting appointment booking process", {
    serviceId: payload.serviceId,
    customerEmail: payload.customerEmail,
    startTime: payload.startTime,
  });

  // 1. Comprehensive validation
  const validationResult = await validateBookingRequest(
    { customerName: payload.customerData.name, customerPhone: payload.customerData.phone, customerAddress: payload.customerData.address, customerNotes: payload.customerData.notes, ...payload},
    {
      serviceRepository,
      customerRepository,
      calendarRepository,
      appointmentRepository,
      timeOffRepository,
      loggerService,
      organizationRepository,
    },
    payload.timezone,
  );

  const {
    validatedPayload,
    service,
    customerId,
    startTime,
    assigneeType,
    endTime,
  } = validationResult;

  // 2. Create appointment
  const appointmentData: AppointmentData = {
    assigneeId: validatedPayload.assigneeId,
    assigneeType,
    customerId,
    serviceId: validatedPayload.serviceId,
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

  await sendAppointmentEmailNotificationFn(
    {
      appointmentId,
      organizationId: validatedPayload.organizationId,
    },
    {
      ...dependencies,
      memberRepository: dependencies.memberRepository,
      userRepository: dependencies.userRepository,
      calendarRepository: dependencies.calendarRepository,
    },
  );

  // 5. Prepare confirmation details
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
