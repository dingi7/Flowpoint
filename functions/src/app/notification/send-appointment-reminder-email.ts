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

export async function sendAppointmentReminderEmailFn(
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

  loggerService.info("Sending appointment reminder email", {
    appointmentId,
    organizationId,
  });

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    loggerService.warn("Appointment not found, skipping reminder email", {
      appointmentId,
    });
    return;
  }

  if (
    appointment.status === APPOINTMENT_STATUS.CANCELLED ||
    appointment.status === APPOINTMENT_STATUS.COMPLETED
  ) {
    loggerService.info("Appointment is cancelled or completed, skipping reminder email", {
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
    loggerService.warn("Customer not found, skipping reminder email", {
      customerId: appointment.customerId,
    });
    return;
  }

  if (!customer.email) {
    loggerService.warn("Customer has no email, skipping reminder email", {
      customerId: customer.id,
    });
    return;
  }

  const service = await serviceRepository.get({
    id: appointment.serviceId,
    organizationId,
  });

  if (!service) {
    loggerService.warn("Service not found, skipping reminder email", {
      serviceId: appointment.serviceId,
    });
    return;
  }

  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.warn("Organization not found, skipping reminder email", {
      organizationId,
    });
    return;
  }

  const fromEmail = organization.settings.contactInfo.email;
  if (!fromEmail) {
    loggerService.warn("Organization has no contact email, skipping reminder email", {
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

  const emailData = {
    customerName,
    serviceName: service.name,
    appointmentDate,
    duration,
    fee: appointment.fee,
    organizationName: organization.name,
    organizationContactInfo: organization.settings.contactInfo,
  };

  const customTemplate = organization.settings.emailTemplates?.reminder;
  const html = buildAppointmentEmailHtml("reminder", emailData, customTemplate);
  const text = buildAppointmentEmailText("reminder", emailData, customTemplate);
  const subject = buildAppointmentEmailSubject("reminder", emailData, customTemplate);

  await mailgunService.sendEmail({
    from: `${organization.name} <${fromEmail}>`,
    to: customer.email,
    subject,
    html,
    text,
  });

  loggerService.info("Appointment reminder email sent successfully", {
    appointmentId,
    customerEmail: customer.email,
  });
}
