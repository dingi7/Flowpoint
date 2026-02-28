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

export async function sendAppointmentReviewRequestEmailFn(
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

  loggerService.info("Sending appointment review request email", {
    appointmentId,
    organizationId,
  });

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    loggerService.warn("Appointment not found, skipping review request email", {
      appointmentId,
    });
    return;
  }

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    loggerService.info("Appointment is cancelled, skipping review request", {
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
    loggerService.warn("Customer not found, skipping review request email", {
      customerId: appointment.customerId,
    });
    return;
  }

  if (!customer.email) {
    loggerService.warn("Customer has no email, skipping review request email", {
      customerId: customer.id,
    });
    return;
  }

  const service = await serviceRepository.get({
    id: appointment.serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.warn("Service not found, skipping review request email", {
      serviceId: appointment.serviceId,
    });
    return;
  }

  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.warn("Organization not found, skipping review request email", {
      organizationId,
    });
    return;
  }

  const fromEmail = organization.settings.contactInfo.email;
  if (!fromEmail) {
    loggerService.warn("Organization has no contact email, skipping review request", {
      organizationId,
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

  const frontendUrl = "https://flowpoint.services";
  const reviewUrl = `${frontendUrl}/review?appointmentId=${appointmentId}&organizationId=${organizationId}`;

  const emailData = {
    customerName,
    serviceName: service.name,
    appointmentDate,
    duration,
    fee: appointment.fee,
    organizationName: organization.name,
    organizationContactInfo: organization.settings.contactInfo,
    reviewUrl,
  };

  const customTemplate = organization.settings.emailTemplates?.review;
  const html = buildAppointmentEmailHtml("review", emailData, customTemplate);
  const text = buildAppointmentEmailText("review", emailData, customTemplate);
  const subject = buildAppointmentEmailSubject("review", emailData, customTemplate);

  await mailgunService.sendEmail({
    from: `${organization.name} <${fromEmail}>`,
    to: customer.email,
    subject,
    html,
    text,
  });

  loggerService.info("Appointment review request email sent successfully", {
    appointmentId,
    customerEmail: customer.email,
  });
}
