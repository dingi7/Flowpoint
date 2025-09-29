import { bookAppointmentFn } from "@/app/appointment/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  fee?: number;
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export const bookAppointment = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request) => {
    loggerService.info("Book appointment request received", {
      data: request.data,
    });

    try {
      const result = await bookAppointmentFn(request.data, {
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

      return {
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      };
    } catch (error) {
      loggerService.error("Book appointment error", error);
      throw new Error(
        `Booking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
