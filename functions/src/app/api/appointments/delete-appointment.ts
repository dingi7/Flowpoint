import {
  AppointmentRepository,
  LoggerService,
} from "@/core";

interface Payload {
  organizationId: string;
  appointmentId: string;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  loggerService: LoggerService;
}

export async function deleteAppointmentApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, appointmentId } = payload;
  const { appointmentRepository, loggerService } = dependencies;

  loggerService.info("Deleting appointment via API", {
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

  await appointmentRepository.delete({
    id: appointmentId,
    organizationId,
  });

  loggerService.info("Appointment deleted successfully", {
    appointmentId,
    organizationId,
  });
}

