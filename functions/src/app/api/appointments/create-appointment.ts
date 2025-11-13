import {
  AppointmentData,
  AppointmentRepository,
  appointmentDataSchema,
  LoggerService,
} from "@/core";

interface Payload {
  organizationId: string;
  data: Omit<AppointmentData, "organizationId">;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  loggerService: LoggerService;
}

export async function createAppointmentApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<string> {
  const { organizationId, data } = payload;
  const { appointmentRepository, loggerService } = dependencies;

  loggerService.info("Creating appointment via API", {
    organizationId,
    serviceId: data.serviceId,
    startTime: data.startTime,
  });

  // Validate appointment data
  const validatedData = appointmentDataSchema.parse({
    ...data,
    organizationId,
  });

  const appointmentId = await appointmentRepository.create({
    data: validatedData,
    organizationId,
  });

  loggerService.info("Appointment created successfully", {
    appointmentId,
    organizationId,
  });

  return appointmentId;
}

