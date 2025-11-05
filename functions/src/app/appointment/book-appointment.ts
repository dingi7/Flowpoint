import {
  APPOINTMENT_STATUS,
  AppointmentRepository,
  CalendarRepository,
  CloudTasksService,
  CustomerRepository,
  LoggerService,
  MailgunService,
  OrganizationRepository,
  Service,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { validateBookingRequest } from "./validation/booking-validation";
import { sendAppointmentConfirmationEmailFn } from "./send-appointment-confirmation-email";

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
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
    mailgunService,
    cloudTasksService,
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

  const {
    validatedPayload,
    service,
    customerId,
    calendar,
    startTime,
    assigneeType,
    endTime,
  } = validationResult;

  // 2. Create appointment
  const appointmentData = {
    assigneeId: validatedPayload.assigneeId,
    assigneeType,
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

  // 3. Send confirmation email
  try {
    await sendAppointmentConfirmationEmailFn(
      {
        appointmentId,
        organizationId: validatedPayload.organizationId,
      },
      {
        appointmentRepository,
        customerRepository,
        serviceRepository,
        organizationRepository,
        mailgunService,
        loggerService,
      },
    );
  } catch (error) {
    loggerService.error("Failed to send confirmation email", error);
  }

  // 4. Schedule reminder email
  try {
    const organization = await organizationRepository.get({
      id: validatedPayload.organizationId,
    });

    if (organization) {
      const reminderHoursBefore =
        organization.settings.appointmentReminderHoursBefore ?? 24;
      const reminderTime = new Date(startTime);
      reminderTime.setHours(
        reminderTime.getHours() - reminderHoursBefore,
      );

      if (reminderTime > new Date()) {
        await cloudTasksService.scheduleTask({
          payload: {
            appointmentId,
            organizationId: validatedPayload.organizationId,
          },
          scheduleTime: reminderTime,
        });

        loggerService.info("Reminder email scheduled", {
          appointmentId,
          reminderTime: reminderTime.toISOString(),
        });
      } else {
        loggerService.warn("Reminder time is in the past, skipping scheduling", {
          appointmentId,
          reminderTime: reminderTime.toISOString(),
        });
      }
    }
  } catch (error) {
    loggerService.error("Failed to schedule reminder email", error);
  }

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
