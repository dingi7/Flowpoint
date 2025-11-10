import {
  Appointment,
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

export async function getAppointmentApiFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<Appointment | null> {
  const { organizationId, appointmentId } = payload;
  const { appointmentRepository, loggerService } = dependencies;

  loggerService.info("Getting appointment via API", {
    organizationId,
    appointmentId,
  });

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    loggerService.info("Appointment not found", {
      appointmentId,
      organizationId,
    });
    return null;
  }

  return appointment;
}

