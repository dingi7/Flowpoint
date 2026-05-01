import {
  AppointmentRepository,
  CalendarRepository,
  CloudTasksService,
  CustomerRepository,
  LoggerService,
  MailgunService,
  MemberRepository,
  OrganizationRepository,
  ServiceRepository,
  UserRepository,
} from "@/core";
import { sendAppointmentAssigneeNotificationFn } from "./send-appointment-assignee-notification";
import { sendAppointmentConfirmationEmailFn } from "./send-appointment-confirmation-email";

interface Payload {
  organizationId: string;
  appointmentId: string;
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
  cloudTasksServiceReminder: CloudTasksService;
  cloudTasksServiceReviewRequest: CloudTasksService;
  cloudTasksServiceRebooking: CloudTasksService;
}

export async function sendAppointmentEmailNotificationFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const {
    appointmentRepository,
    organizationRepository,
    loggerService,
    cloudTasksServiceReminder,
    cloudTasksServiceReviewRequest,
  } = dependencies;
  const { organizationId, appointmentId } = payload;

  const organization = await organizationRepository.get({ id: organizationId });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  if (!organization.settings.emailNotifications) {
    loggerService.info(
      "Email notifications are disabled for this organization",
      { organizationId },
    );
    return;
  }

  try {
    await sendAppointmentConfirmationEmailFn(payload, dependencies);
  } catch (error) {
    loggerService.error("Failed to send appointment email notification", error);
  }

  // Send notification to assignee if dependencies are available

  try {
    await sendAppointmentAssigneeNotificationFn(payload, dependencies);
  } catch (error) {
    loggerService.error("Failed to send assignee notification email", error);
  }

  const appointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId,
  });

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  const reminderHoursBefore =
    organization.settings.appointmentReminderHoursBefore ?? 24;

  const reminderTime = new Date(appointment.startTime);
  reminderTime.setHours(reminderTime.getHours() - reminderHoursBefore);

  const reviewRequestTime = new Date(appointment.startTime);
  reviewRequestTime.setHours(reviewRequestTime.getHours() + 6);

  const now = new Date();

  const scheduleEmail = async (
    service: CloudTasksService,
    scheduleTime: Date,
    label: string,
  ) => {
    try {
      if (scheduleTime > now) {
        await service.scheduleTask({
          payload: {
            appointmentId,
            organizationId,
          },
          scheduleTime,
        });

        loggerService.info(`${label} email scheduled`, {
          appointmentId,
          scheduleTime: scheduleTime.toISOString(),
        });
      } else {
        loggerService.warn(`${label} time is in the past, skipping scheduling`, {
          appointmentId,
          scheduleTime: scheduleTime.toISOString(),
        });
      }
    } catch (error) {
      loggerService.error(`Failed to schedule ${label} email`, error);
    }
  };

  await scheduleEmail(
    cloudTasksServiceReminder,
    reminderTime,
    "Reminder",
  );
  await scheduleEmail(
    cloudTasksServiceReviewRequest,
    reviewRequestTime,
    "Review request",
  );
}
