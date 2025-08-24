import { hasTimeslotOverlap } from "@/app/availability/util/appointment-overlap";
import {
  APPOINTMENT_STATUS,
  ASSIGNEE_TYPE,
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  LoggerService,
  OrganizationRepository,
  ServiceRepository,
  TimeOffRepository,
} from "@/core";
import { createCustomerWithFields } from "@/utils/customer-utils";
import z from "zod";

// Validation schemas
const bookAppointmentPayloadSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  customerEmail: z.string().min(1, "Customer EMAIL is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  startTime: z.string().datetime("Invalid start time format"),
  assigneeId: z.string().min(1, "Assignee ID is required"),
  assigneeType: z.nativeEnum(ASSIGNEE_TYPE),
  title: z.string().optional(),
  description: z.string().optional(),
  fee: z.number().min(0).optional(),
  additionalCustomerFields: z.record(z.string(), z.unknown()).optional(),
});

type BookAppointmentPayload = z.infer<typeof bookAppointmentPayloadSchema>;

interface Dependencies {
  serviceRepository: ServiceRepository;
  customerRepository: CustomerRepository;
  calendarRepository: CalendarRepository;
  appointmentRepository: AppointmentRepository;
  timeOffRepository: TimeOffRepository;
  loggerService: LoggerService;
  organizationRepository: OrganizationRepository;
}

/**
 * Comprehensive validation for appointment booking
 */
export async function validateBookingRequest(
  payload: BookAppointmentPayload,
  dependencies: Dependencies,
) {
  const {
    serviceRepository,
    customerRepository,
    calendarRepository,
    appointmentRepository,
    timeOffRepository,
    loggerService,
    organizationRepository,
  } = dependencies;

  // 1. Input validation
  const validatedPayload = bookAppointmentPayloadSchema.parse(payload);

  // Organization validation
  const organization = await organizationRepository.get({
    id: validatedPayload.organizationId,
  });

  if (!organization) {
    throw new Error(
      `Organization not found: ${validatedPayload.organizationId}`,
    );
  }

  // 2. Service validation
  const service = await serviceRepository.get({
    id: validatedPayload.serviceId,
    organizationId: validatedPayload.organizationId,
  });

  if (!service) {
    throw new Error(`Service not found: ${validatedPayload.serviceId}`);
  }

  // 3. Customer validation
  let customerId: string;

  const customers = await customerRepository.getAll({
    queryConstraints: [
      { field: "email", operator: "==", value: validatedPayload.customerEmail },
    ],
    organizationId: validatedPayload.organizationId,
  });

  if (!customers || customers.length === 0) {
    loggerService.info("Customer does not exist, creating...", {
      email: validatedPayload.customerEmail,
      organizationId: validatedPayload.organizationId,
    });

    // Create customer data with validation
    const customerData = createCustomerWithFields(
      {
        organizationId: validatedPayload.organizationId,
        email: validatedPayload.customerEmail,
      },
      validatedPayload.additionalCustomerFields || {},
      organization,
    );

    customerId = await customerRepository.create({
      data: customerData,
      organizationId: validatedPayload.organizationId,
    });
  } else {
    customerId = customers[0].id;
  }

  // 4. Calendar validation
  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: service.ownerId },
      { field: "ownerType", operator: "==", value: service.ownerType },
    ],
    organizationId: validatedPayload.organizationId,
  });

  if (!calendars || calendars.length === 0) {
    throw new Error(`No calendar found for service owner: ${service.ownerId}`);
  }

  const calendar = calendars[0];

  // 5. Time validation
  const startTime = new Date(validatedPayload.startTime);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + service.duration);

  // Check if appointment is in the past
  if (startTime <= new Date()) {
    throw new Error("Cannot book appointments in the past");
  }

  // 6. Business hours validation
  const dayOfWeek = startTime.toLocaleDateString("en-US", {
    weekday: "long",
  }) as keyof typeof calendar.workingHours;
  const workingHours = calendar.workingHours[dayOfWeek];

  if (!workingHours || workingHours.length === 0) {
    throw new Error(`No working hours defined for ${dayOfWeek}`);
  }

  // 7. Get existing appointments and time-offs for conflict checking
  const existingAppointments = await appointmentRepository.getAll({
    queryConstraints: [
      { field: "calendarId", operator: "==", value: calendar.id },
      { field: "status", operator: "!=", value: APPOINTMENT_STATUS.CANCELLED },
    ],
    organizationId: validatedPayload.organizationId,
  });

  const timeOffs = await timeOffRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: service.ownerId },
      { field: "ownerType", operator: "==", value: service.ownerType },
    ],
    organizationId: validatedPayload.organizationId,
  });

  // 8. Conflict detection
  const hasConflict = hasTimeslotOverlap({
    slotStart: startTime,
    slotEnd: endTime,
    existingAppointments,
    timeOffs,
    bufferTime: calendar.bufferTime || 0,
  });

  if (hasConflict) {
    throw new Error(
      `The requested time slot conflicts with existing appointments or time-off ${{
        requestedStart: startTime.toISOString(),
        requestedEnd: endTime.toISOString(),
        conflictingAppointments: existingAppointments.filter((apt) => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(aptStart);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
          return startTime < aptEnd && endTime > aptStart;
        }),
      }}`,
    );
  }

  return {
    validatedPayload,
    service,
    customerId,
    calendar,
    startTime,
    endTime,
  };
}
