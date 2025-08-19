import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";

interface Payload {
  appointmentId: string;
  customerId: string;
  startTime: string;
  duration: number;
}

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

export const bookAppointment = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request) => {
    loggerService.info("getAvalibleTimeslots request");

    const { data } = request;

    loggerService.info("getAvalibleTimeslots request.data", data);

    try {
      const result = ''
      return result;
    } catch (error) {
      loggerService.error("getAvalibleTimeslots error", error);
      throw new Error("Error getting available timeslots");
    }
  },
);
