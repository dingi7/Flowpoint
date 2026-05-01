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
  addOnServiceIds?: string[];
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
      basePrice?: number;
      finalPrice?: number;
      discountAmount?: number;
      pricingRuleId?: string;
      pricingLabel?: string;
    }[];
  }>;
  bookAppointment(
    payload: BookAppointmentPayload
  ): Promise<BookAppointmentResponse>;
  getBookingSuggestions(payload: {
    organizationId: string;
    serviceId: string;
    customerEmail?: string;
  }): Promise<{
    success: boolean;
    suggestions: import("../../entities/booking-suggestion").BookingSuggestion[];
  }>;
}
