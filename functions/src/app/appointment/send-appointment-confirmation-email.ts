import {
  AppointmentRepository,
  CustomerRepository,
  LoggerService,
  MailgunService,
  OrganizationRepository,
  ServiceRepository,
} from "@/core";
import {
  buildAppointmentEmailHtml,
  buildAppointmentEmailText,
  formatAppointmentDateTime,
  formatDuration,
  getCustomerName,
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

export async function sendAppointmentConfirmationEmailFn(
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

  loggerService.info("Sending appointment confirmation email", {
    appointmentId,
    organizationId,
  });

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  const customer = await customerRepository.get({
    id: appointment.customerId,
    organizationId,
  });

  if (!customer) {
    throw new Error(`Customer not found: ${appointment.customerId}`);
  }

  if (!customer.email) {
    loggerService.warn("Customer has no email, skipping confirmation email", {
      customerId: customer.id,
    });
    return;
  }

  const service = await serviceRepository.get({
    id: appointment.serviceId,
    organizationId,
  });

  if (!service) {
    throw new Error(`Service not found: ${appointment.serviceId}`);
  }

  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const fromEmail = organization.settings.contactInfo.email;
  if (!fromEmail) {
    loggerService.warn("Organization has no contact email, skipping confirmation email", {
      organizationId,
    });
    return;
  }

  const appointmentDate = formatAppointmentDateTime(
    appointment.startTime,
    organization.settings.timezone,
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

  const html = buildAppointmentEmailHtml("confirmation", emailData);
  const text = buildAppointmentEmailText("confirmation", emailData);

  await mailgunService.sendEmail({
    from: `${organization.name} <${fromEmail}>`,
    to: customer.email,
    subject: `Appointment Confirmed - ${service.name}`,
    html,
    text,
  });

  loggerService.info("Appointment confirmation email sent successfully", {
    appointmentId,
    customerEmail: customer.email,
  });
}
