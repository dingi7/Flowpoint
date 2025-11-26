import { OWNER_TYPE } from "@/core/entities/calendar";

export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface BookAppointmentPayload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  assigneeType: OWNER_TYPE;
  fee?: number;
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export interface BookAppointmentResponse {
  success: boolean;
  appointmentId: string;
  confirmationDetails: unknown;
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
  bookAppointment(payload: BookAppointmentPayload): Promise<BookAppointmentResponse>;
}
