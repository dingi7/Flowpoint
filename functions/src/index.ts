import { getApps, initializeApp } from "firebase-admin/app";

/**
 * Initialize Firebase app
 */
if (!getApps().length) {
  initializeApp();
}

export { onClerkWebhookEvent } from "./functions/clerk/on-clerk-event-webhook";
export { onClerkUserCreated } from "./functions/clerk/on-clerk-user-created";
export { onClerkUserDeleted } from "./functions/clerk/on-clerk-user-deleted";

// <-- Available Timeslots -->
export { getAvailableTimeslots } from "./functions/availability/get-available-timeslots";

// <-- Appointment Booking -->
export { bookAppointment } from "./functions/appointment/book-appointment";

// <-- Organization Member Managment -->
export { createOrganizationInvite } from "./functions/invite/create-organization-invite";
export { acceptOrganizationInvite } from "./functions/invite/accept-organization-invite";

// <-- Organization Creation -->
export { createOrganization } from "./functions/organization/create-organization";