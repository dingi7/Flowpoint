import {
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  LoggerService,
  MailgunService,
  MemberRepository,
  OrganizationRepository,
  OWNER_TYPE,
  ServiceRepository,
  UserRepository,
} from "@/core";
import {
  buildAppointmentEmailHtml,
  buildAppointmentEmailSubject,
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
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  calendarRepository: CalendarRepository;
  mailgunService: MailgunService;
  loggerService: LoggerService;
}

export async function sendAppointmentAssigneeNotificationFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const {
    appointmentRepository,
    customerRepository,
    serviceRepository,
    organizationRepository,
    memberRepository,
    userRepository,
    calendarRepository,
    mailgunService,
    loggerService,
  } = dependencies;

  const { appointmentId, organizationId } = payload;

  loggerService.info("Sending appointment assignee notification email", {
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

  // Only send notification if assignee is a member
  if (appointment.assigneeType !== OWNER_TYPE.MEMBER) {
    loggerService.info(
      "Assignee is not a member, skipping assignee notification",
      {
        assigneeType: appointment.assigneeType,
      },
    );
    return;
  }

  const member = await memberRepository.get({
    id: appointment.assigneeId,
    organizationId,
  });

  if (!member) {
    throw new Error(`Member not found: ${appointment.assigneeId}`);
  }

  const user = await userRepository.get({ id: appointment.assigneeId });

  if (!user) {
    throw new Error(`User not found: ${appointment.assigneeId}`);
  }

  if (!user.email) {
    loggerService.warn(
      "Assignee has no email, skipping assignee notification",
      {
        assigneeId: appointment.assigneeId,
      },
    );
    return;
  }

  const customer = await customerRepository.get({
    id: appointment.customerId,
    organizationId,
  });

  if (!customer) {
    throw new Error(`Customer not found: ${appointment.customerId}`);
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
    loggerService.warn(
      "Organization has no contact email, skipping assignee notification",
      {
        organizationId,
      },
    );
    return;
  }

  // Get member's calendar timezone or fallback to organization timezone
  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: appointment.assigneeId },
      { field: "ownerType", operator: "==", value: OWNER_TYPE.MEMBER },
    ],
    organizationId,
  });

  const timezone =
    calendars.length > 0 && calendars[0].timeZone
      ? calendars[0].timeZone
      : organization.settings.timezone;

  const appointmentDate = formatAppointmentDateTime(
    appointment.startTime,
    timezone,
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

  // Use info template for assignee notification
  const customTemplate = organization.settings.emailTemplates?.info;
  const html = buildAppointmentEmailHtml(
    "info",
    emailData,
    customTemplate,
  );
  const text = buildAppointmentEmailText(
    "info",
    emailData,
    customTemplate,
  );
  const subject = buildAppointmentEmailSubject(
    "info",
    emailData,
    customTemplate,
  );

  await mailgunService.sendEmail({
    from: `${organization.name} <${fromEmail}>`,
    to: user.email,
    subject,
    html,
    text,
  });

  loggerService.info(
    "Appointment assignee notification email sent successfully",
    {
      appointmentId,
      assigneeEmail: user.email,
    },
  );
}
