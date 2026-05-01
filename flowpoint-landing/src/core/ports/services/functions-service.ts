export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface BookAppointmentPayload {
  serviceId: string;
  customerEmail: string;
  customerData: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
  organizationId: string;
  startTime: string;
  assigneeId: string;
  fee?: number;
  title?: string;
  description?: string;
  timezone?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export interface BookAppointmentResponse {
  success: boolean;
  appointmentId: string;
  confirmationDetails: unknown;
}

export type AnalyzeHairstyleStatus = "ok" | "needs_better_photo";

export type HairstyleMaintenanceLevel = "low" | "medium" | "high";

export interface HairstyleRecommendation {
  title: string;
  matchedServiceId?: string;
  reason: string;
  stylingNotes: string;
  maintenanceLevel: HairstyleMaintenanceLevel;
  bookingLabel: string;
  previewImageDataUrl?: string;
}

export interface AnalyzeHairstylePayload {
  organizationId: string;
  imageDataUrl: string;
  locale: "en" | "bg" | "tr";
}

export interface AnalyzeHairstyleResponse {
  success: boolean;
  status: AnalyzeHairstyleStatus;
  analysisSummary: {
    faceShape?: string;
    visibleHairNotes: string[];
    imageQualityNotes: string[];
  };
  recommendations: HairstyleRecommendation[];
}

export interface GenerateHairstylePreviewPayload {
  organizationId: string;
  imageDataUrl: string;
  locale: "en" | "bg" | "tr";
  recommendation: Omit<HairstyleRecommendation, "previewImageDataUrl">;
}

export interface GenerateHairstylePreviewResponse {
  success: boolean;
  previewImageDataUrl?: string;
}

export interface FunctionsService {
  getAvailableTimeslots(payload: {
    serviceId: string;
    date: string;
    organizationId: string;
    assigneeId: string;
  }): Promise<{
    result: {
      start: string;
      end: string;
    }[];
  }>;
  bookAppointment(
    payload: BookAppointmentPayload
  ): Promise<BookAppointmentResponse>;
  analyzeHairstyle(
    payload: AnalyzeHairstylePayload
  ): Promise<AnalyzeHairstyleResponse>;
  generateHairstylePreview(
    payload: GenerateHairstylePreviewPayload
  ): Promise<GenerateHairstylePreviewResponse>;
}
