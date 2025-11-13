import { bookAppointmentFn } from "../appointment/book-appointment";

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  title?: string;
  description?: string;
  timezone?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

// Re-export the existing bookAppointmentFn for API use
export async function bookAppointmentApiFn(
  payload: Payload,
  dependencies: Parameters<typeof bookAppointmentFn>[1],
) {
  return bookAppointmentFn(payload, dependencies);
}

