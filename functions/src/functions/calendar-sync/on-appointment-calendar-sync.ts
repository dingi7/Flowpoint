import {
  Appointment,
  APPOINTMENT_STATUS,
  OWNER_TYPE,
} from "@/core";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { deleteAppointmentFromGoogleCalendar, upsertAppointmentInGoogleCalendar } from "@/app/calendar-sync/sync-google-calendar-event";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const calendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);
const calendarRepository = repositoryHost.getCalendarRepository(databaseService);
const customerRepository = repositoryHost.getCustomerRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const googleOAuthClientId = defineSecret(Secrets.GOOGLE_OAUTH_CLIENT_ID);
const googleOAuthClientSecret = defineSecret(Secrets.GOOGLE_OAUTH_CLIENT_SECRET);

function isMemberAssignee(appointment: Appointment | undefined): boolean {
  return !!appointment && appointment.assigneeType === OWNER_TYPE.MEMBER;
}

export const onAppointmentCalendarSync = onDocumentWritten(
  {
    document: "organizations/{organizationId}/appointments/{appointmentId}",
    secrets: [googleOAuthClientId, googleOAuthClientSecret],
  },
  async (event) => {
    const organizationId = event.params.organizationId;
    const beforeData = event.data?.before?.data() as Appointment | undefined;
    const afterData = event.data?.after?.data() as Appointment | undefined;

    const dependencies = {
      calendarSyncConnectionRepository,
      calendarRepository,
      customerRepository,
      serviceRepository,
      organizationRepository,
      secretManagerService,
      loggerService,
      googleOAuthClientId: googleOAuthClientId.value(),
      googleOAuthClientSecret: googleOAuthClientSecret.value(),
    };

    try {
      // Create
      if (!beforeData && afterData) {
        if (
          isMemberAssignee(afterData) &&
          afterData.status !== APPOINTMENT_STATUS.CANCELLED
        ) {
          await upsertAppointmentInGoogleCalendar(
            {
              organizationId,
              appointment: afterData,
              memberId: afterData.assigneeId,
            },
            dependencies,
          );
        }
        return;
      }

      // Delete
      if (beforeData && !afterData) {
        if (isMemberAssignee(beforeData)) {
          await deleteAppointmentFromGoogleCalendar(
            {
              organizationId,
              appointmentId: beforeData.id,
              memberId: beforeData.assigneeId,
            },
            dependencies,
          );
        }
        return;
      }

      if (!beforeData || !afterData) {
        return;
      }

      const assigneeChanged = beforeData.assigneeId !== afterData.assigneeId;

      // Update where assignee changed: delete old then upsert new.
      if (assigneeChanged) {
        if (isMemberAssignee(beforeData)) {
          await deleteAppointmentFromGoogleCalendar(
            {
              organizationId,
              appointmentId: beforeData.id,
              memberId: beforeData.assigneeId,
            },
            dependencies,
          );
        }

        if (
          isMemberAssignee(afterData) &&
          afterData.status !== APPOINTMENT_STATUS.CANCELLED
        ) {
          await upsertAppointmentInGoogleCalendar(
            {
              organizationId,
              appointment: afterData,
              memberId: afterData.assigneeId,
            },
            dependencies,
          );
        }
        return;
      }

      if (!isMemberAssignee(afterData)) {
        return;
      }

      if (afterData.status === APPOINTMENT_STATUS.CANCELLED) {
        await deleteAppointmentFromGoogleCalendar(
          {
            organizationId,
            appointmentId: afterData.id,
            memberId: afterData.assigneeId,
          },
          dependencies,
        );
        return;
      }

      await upsertAppointmentInGoogleCalendar(
        {
          organizationId,
          appointment: afterData,
          memberId: afterData.assigneeId,
        },
        dependencies,
      );
    } catch (error) {
      loggerService.error("Appointment calendar sync trigger failed", {
        organizationId,
        beforeAppointmentId: beforeData?.id,
        afterAppointmentId: afterData?.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
