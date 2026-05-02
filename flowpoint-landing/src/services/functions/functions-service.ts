import {
  AnalyzeHairstylePayload,
  AnalyzeHairstyleResponse,
  BookAppointmentPayload,
  BookAppointmentResponse,
  FunctionsService,
  GenerateHairstylePreviewPayload,
  GenerateHairstylePreviewResponse,
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
  async analyzeHairstyle(payload) {
    const result = await httpsCallable<
      AnalyzeHairstylePayload,
      AnalyzeHairstyleResponse
    >(
      firebase.functions,
      "analyzeHairstyle",
    )(payload);
    return result.data;
  },
  async generateHairstylePreview(payload) {
    const result = await httpsCallable<
      GenerateHairstylePreviewPayload,
      GenerateHairstylePreviewResponse
    >(
      firebase.functions,
      "generateHairstylePreview",
    )(payload);
    return result.data;
  },
};
