import { scheduleSmartRebookingReminderFn } from "@/app/rebooking/schedule-smart-rebooking-reminder";
import { Secrets } from "@/config/secrets";
import { APPOINTMENT_STATUS, Appointment } from "@/core";
import { DatabaseCollection } from "@/repositories/config";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { defineSecret } from "firebase-functions/params";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const cloudTasksServiceRebooking = serviceHost.getCloudTasksService(
  "sendAppointmentRebookingReminder",
);
const googleGenAiApiKey = defineSecret(Secrets.GOOGLE_GENAI_API_KEY);

export const onAppointmentCompletedRebooking = onDocumentWritten(
  {
    document: `organizations/{organizationId}/${DatabaseCollection.APPOINTMENTS}/{appointmentId}`,
    secrets: [googleGenAiApiKey],
  },
  async (event) => {
    const { organizationId, appointmentId } = event.params;
    const beforeData = event.data?.before?.data() as Appointment | undefined;
    const afterSnapshot = event.data?.after;
    const afterData = afterSnapshot?.data() as Appointment | undefined;

    if (!afterData) {
      return;
    }

    const becameCompleted =
      beforeData?.status !== APPOINTMENT_STATUS.COMPLETED &&
      afterData.status === APPOINTMENT_STATUS.COMPLETED;

    if (!becameCompleted) {
      return;
    }

    try {
      const apiKey = googleGenAiApiKey.value();
      await scheduleSmartRebookingReminderFn(
        {
          organizationId,
          appointment: {
            ...afterData,
            id: appointmentId,
          },
        },
        {
          appointmentRepository,
          cloudTasksServiceRebooking,
          genkitService: apiKey
            ? serviceHost.getGenkitService({ apiKey })
            : undefined,
          loggerService,
          serviceRepository,
        },
      );
    } catch (error) {
      loggerService.error("Smart rebooking scheduling failed", {
        organizationId,
        appointmentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
