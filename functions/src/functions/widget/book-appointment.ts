import { bookAppointmentFn } from "@/app/appointment/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const loggerService = serviceHost.getLoggerService();

const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export const widgetBookAppointment = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    // secrets: [adminClerkWebhookSecret],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed", success: false });
      return;
    }

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

      // Validate booking data
      if (!payload.serviceId || !payload.customerEmail || !payload.startTime) {
        res.status(400).json({
          error: "Missing required booking fields",
          success: false,
        });
        return;
      }

      const result = await bookAppointmentFn(payload, {
        appointmentRepository,
        serviceRepository,
        customerRepository,
        calendarRepository,
        timeOffRepository,
        loggerService,
        organizationRepository,
      });

      loggerService.info("Appointment booked successfully", {
        appointmentId: result.appointmentId,
      });
      res.status(200).json({
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      });
    } catch (error) {
      loggerService.error("Error booking appointment:", error);
      res.status(500).json({
        error: "Failed to book appointment",
        success: false,
        appointmentId: null,
        confirmationDetails: null,
      });
    }
  },
);
