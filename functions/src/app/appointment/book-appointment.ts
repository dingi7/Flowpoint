import { APPOINTMENT_STATUS, AppointmentRepository, ASSIGNEE_TYPE, LoggerService, ServiceRepository } from "@/core";

interface Payload {
    serviceId: string
    organizationId: string
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  serviceRepository: ServiceRepository;
  loggerService: LoggerService;
}

export async function bookAppointmentFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { serviceId, organizationId } = payload
  const { appointmentRepository, serviceRepository, loggerService } = dependencies;

  const service = await serviceRepository.get({id: serviceId, organizationId})
  if (!service) {
    loggerService.error("Service not found", {
      serviceId,
      organizationId,
    })
    throw new Error("Service not found")
  }

  const appointment = await appointmentRepository.create({
    data: {
      serviceId,
      organizationId,
      customerId: "customerId",
      title: service.name,
      status: APPOINTMENT_STATUS.PENDING,
      assigneeType: ASSIGNEE_TYPE.MEMBER,
      assigneeId: "assigneeId",
    }
  })


}
