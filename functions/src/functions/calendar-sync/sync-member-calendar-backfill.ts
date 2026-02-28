import { upsertAppointmentInGoogleCalendar } from "@/app/calendar-sync/sync-google-calendar-event";
import {
  APPOINTMENT_STATUS,
  CALENDAR_SYNC_BACKFILL_STATUS,
  CalendarSyncConnectionRepository,
} from "@/core";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const calendarSyncConnectionRepository: CalendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
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

interface Payload {
  organizationId: string;
  memberId: string;
}

export const syncMemberCalendarBackfill = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [googleOAuthClientId, googleOAuthClientSecret],
  },
  async (req, res) => {
    const payload = req.body as Payload;
    const { organizationId, memberId } = payload;

    if (!organizationId || !memberId) {
      res.status(400).send("organizationId and memberId are required");
      return;
    }

    try {
      await calendarSyncConnectionRepository.update({
        organizationId,
        id: memberId,
        data: {
          backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.RUNNING,
          lastError: "",
        },
      });

      const appointments = await appointmentRepository.getAll({
        organizationId,
        queryConstraints: [
          {
            field: "assigneeId",
            operator: "==",
            value: memberId,
          },
        ],
      });

      const upcomingActiveAppointments = appointments.filter(
        (appointment) =>
          appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
          new Date(appointment.startTime).getTime() >= Date.now(),
      );

      for (const appointment of upcomingActiveAppointments) {
        await upsertAppointmentInGoogleCalendar(
          {
            organizationId,
            appointment,
            memberId,
          },
          {
            calendarSyncConnectionRepository,
            calendarRepository,
            customerRepository,
            serviceRepository,
            organizationRepository,
            secretManagerService,
            loggerService,
            googleOAuthClientId: googleOAuthClientId.value(),
            googleOAuthClientSecret: googleOAuthClientSecret.value(),
          },
        );
      }

      await calendarSyncConnectionRepository.update({
        organizationId,
        id: memberId,
        data: {
          backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.COMPLETED,
          lastError: "",
        },
      });

      res.status(200).send("Backfill complete");
    } catch (error) {
      loggerService.error("Calendar sync backfill failed", {
        organizationId,
        memberId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await calendarSyncConnectionRepository
        .update({
          organizationId,
          id: memberId,
          data: {
            backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.FAILED,
            lastError:
              error instanceof Error ? error.message : "Unknown backfill error",
          },
        })
        .catch(() => undefined);

      res.status(500).send("Backfill failed");
    }
  },
);
