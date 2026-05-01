import {
  BookingSuggestion,
  FunctionsService,
  BookAppointmentPayload,
  BookAppointmentResponse,
} from "@/core";
import { firebase } from "@/infrastructure/firebase";
import { httpsCallable } from "@firebase/functions";

export const functionsService: FunctionsService = {
  async getAvailableTimeslots(payload) {
    const result = await httpsCallable<
      {
        serviceId: string;
        date: string;
        organizationId: string;
        assigneeId: string;
      },
      {
        start: string;
        end: string;
        basePrice?: number;
        finalPrice?: number;
        discountAmount?: number;
        pricingRuleId?: string;
        pricingLabel?: string;
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
  },
  async getBookingSuggestions(payload) {
    const result = await httpsCallable<
      {
        organizationId: string;
        serviceId: string;
        customerEmail?: string;
      },
      {
        success: boolean;
        suggestions: BookingSuggestion[];
      }
    >(
      firebase.functions,
      "getBookingSuggestions",
    )(payload);
    return result.data;
  }
};
