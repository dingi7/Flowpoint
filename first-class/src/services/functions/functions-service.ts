import { FunctionsService, BookAppointmentPayload, BookAppointmentResponse } from "@/core";
import { firebase } from "@/infrastructure/firebase";
import { httpsCallable } from "@firebase/functions";

export const functionsService: FunctionsService = {
  async getAvailableTimeslots(payload) {
    const result = await httpsCallable<
      {
        serviceId: string;
        date: string;
        organizationId: string;
      },
      {
        start: string;
        end: string;
      }[]
    >(
      firebase.functions,
      "getAvailableTimeslots",
    )(payload);
    return { result: result.data };
  },
  async bookAppointment(payload) {
    const result = await httpsCallable<
      BookAppointmentPayload,
      BookAppointmentResponse
    >(
      firebase.functions,
      "bookAppointment",
    )(payload);
    return result.data;
  }
};
