import { ASSIGNEE_TYPE } from "@/core/entities/appointment";

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
  assigneeType: ASSIGNEE_TYPE;
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
  }): Promise<{
    result: {
      start: string;
      end: string;
    }[];
  }>;
  bookAppointment(payload: BookAppointmentPayload): Promise<BookAppointmentResponse>;
}
