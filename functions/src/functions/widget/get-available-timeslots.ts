import { getAvailableTimeslotsFn } from "@/app/availability/get-available-timeslots";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

interface Payload {
  organizationId: string;
  serviceId: string;
  date: string;
}

export const widgetGetAvailableTimeslots = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req, res) => {
    try {
      const payload = req.body as Payload;

      if (
        !payload.organizationId ||
        typeof payload.organizationId !== "string"
      ) {
        res.status(400).json({
          error: "Missing or invalid organizationId parameter",
          success: false,
        });
        return;
      }
      if (!payload.serviceId || typeof payload.serviceId !== "string") {
        res.status(400).json({
          error: "Missing or invalid serviceId parameter",
          success: false,
        });
        return;
      }

      if (!payload.date || typeof payload.date !== "string") {
        res.status(400).json({
          error: "Missing or invalid date parameter",
          success: false,
        });
        return;
      }

      const timeslots = await getAvailableTimeslotsFn(payload, {
        calendarRepository,
        serviceRepository,
        loggerService,
        timeOffRepository,
        appointmentRepository,
      });

      res.json({
        timeslots,
        success: true,
      });
    } catch (error) {
      loggerService.error("Error fetching timeslots:", error);
      res.status(500).json({
        error: "Failed to fetch timeslots",
        success: false,
      });
    }
  },
);
