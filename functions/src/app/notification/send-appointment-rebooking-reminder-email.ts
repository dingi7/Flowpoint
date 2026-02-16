import {
  APPOINTMENT_STATUS,
  AppointmentRepository,
  CustomerRepository,
  LoggerService,
  MailgunService,
  OrganizationRepository,
  ServiceRepository,
} from "@/core";
import {
  buildAppointmentEmailHtml,
  buildAppointmentEmailSubject,
  buildAppointmentEmailText,
  formatAppointmentDateTime,
  formatDuration,
  getCustomerName,
  getCustomerTimezone,
} from "@/utils/email-utils";

interface Payload {
  appointmentId: string;
  organizationId: string;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  customerRepository: CustomerRepository;
  serviceRepository: ServiceRepository;
  organizationRepository: OrganizationRepository;
  mailgunService: MailgunService;
  loggerService: LoggerService;
}

export async function sendAppointmentRebookingReminderEmailFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const {
    appointmentRepository,
    customerRepository,
    serviceRepository,
    organizationRepository,
    mailgunService,
    loggerService,
  } = dependencies;

  const { appointmentId, organizationId } = payload;

  loggerService.info("Sending appointment rebooking reminder email", {
    appointmentId,
    organizationId,
  });

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    loggerService.warn("Appointment not found, skipping rebooking reminder", {
      appointmentId,
    });
    return;
  }

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    loggerService.info("Appointment is cancelled, skipping rebooking reminder", {
      appointmentId,
      status: appointment.status,
    });
    return;
  }

  const customer = await customerRepository.get({
    id: appointment.customerId,
    organizationId,
  });

  if (!customer) {
    loggerService.warn("Customer not found, skipping rebooking reminder", {
      customerId: appointment.customerId,
    });
    return;
  }

  if (!customer.email) {
    loggerService.warn("Customer has no email, skipping rebooking reminder", {
      customerId: customer.id,
    });
    return;
  }

  const service = await serviceRepository.get({
    id: appointment.serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.warn("Service not found, skipping rebooking reminder", {
      serviceId: appointment.serviceId,
    });
    return;
  }

  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.warn("Organization not found, skipping rebooking reminder", {
      organizationId,
    });
    return;
  }

  const fromEmail = organization.settings.contactInfo.email;
  if (!fromEmail) {
    loggerService.warn("Organization has no contact email, skipping rebooking reminder", {
      organizationId,
    });
    return;
  }

  const recentAppointments = await appointmentRepository.getAll({
    queryConstraints: [
      { field: "customerId", operator: "==", value: appointment.customerId },
    ],
    orderBy: { field: "startTime", direction: "desc" },
    pagination: { limit: 5 },
    organizationId,
  });

  const latestNonCancelled = recentAppointments.find(
    (item) => item.status !== APPOINTMENT_STATUS.CANCELLED,
  );

  if (!latestNonCancelled) {
    loggerService.info("No non-cancelled appointments found, skipping rebooking", {
      appointmentId,
      customerId: appointment.customerId,
    });
    return;
  }

  if (latestNonCancelled.id !== appointmentId) {
    loggerService.info("Newer appointment exists, skipping rebooking reminder", {
      appointmentId,
      latestAppointmentId: latestNonCancelled.id,
    });
    return;
  }

  const customerTimezone = getCustomerTimezone(customer);
  const appointmentDate = formatAppointmentDateTime(
    appointment.startTime,
    customerTimezone,
  );
  const duration = formatDuration(appointment.duration);
  const customerName = getCustomerName(customer);

  const emailData = {
    customerName,
    serviceName: service.name,
    appointmentDate,
    duration,
    fee: appointment.fee,
    organizationName: organization.name,
    organizationContactInfo: organization.settings.contactInfo,
  };

  const customTemplate = organization.settings.emailTemplates?.rebooking;
  const html = buildAppointmentEmailHtml("rebooking", emailData, customTemplate);
  const text = buildAppointmentEmailText("rebooking", emailData, customTemplate);
  const subject = buildAppointmentEmailSubject("rebooking", emailData, customTemplate);

  await mailgunService.sendEmail({
    from: `${organization.name} <${fromEmail}>`,
    to: customer.email,
    subject,
    html,
    text,
  });

  loggerService.info("Appointment rebooking reminder email sent successfully", {
    appointmentId,
    customerEmail: customer.email,
  });
}
