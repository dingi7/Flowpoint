import {
  AppointmentData,
  AppointmentRepository,
  appointmentDataSchema,
  LoggerService,
} from "@/core";

interface Payload {
  organizationId: string;
  appointmentId: string;
  data: Partial<Omit<AppointmentData, "organizationId">>;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  loggerService: LoggerService;
}

export async function updateAppointmentApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, appointmentId, data } = payload;
  const { appointmentRepository, loggerService } = dependencies;

  loggerService.info("Updating appointment via API", {
    organizationId,
    appointmentId,
  });

  // Verify appointment exists and belongs to organization
  const existingAppointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!existingAppointment) {
    loggerService.info("Appointment not found", {
      appointmentId,
      organizationId,
    });
    throw new Error("Appointment not found");
  }

  // Validate updated data (merge with existing)
  const updatedData = appointmentDataSchema.partial().parse({
    ...data,
    organizationId, // Ensure organizationId is preserved
  });

  await appointmentRepository.update({
    id: appointmentId,
    data: updatedData,
    organizationId,
  });

  loggerService.info("Appointment updated successfully", {
    appointmentId,
    organizationId,
  });
}

