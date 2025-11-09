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
export { sendAppointmentReminder } from "./functions/appointment/send-appointment-reminder";

// <-- Organization Member Managment -->
export { createOrganizationInvite } from "./functions/invite/create-organization-invite";
export { acceptOrganizationInvite } from "./functions/invite/accept-organization-invite";
export { kickOrganizationMember } from "./functions/member/delete-member";

// <-- Organization Creation -->
export { createOrganization } from "./functions/organization/create-organization";

// <-- API Key Management -->
export { createApiKey } from "./functions/organization/create-api-key";
export { revokeApiKey } from "./functions/organization/revoke-api-key";

// <-- Widget Public API -->
export { widgetGetOrganizationServices } from "./functions/widget/get-organization-services";
export { widgetGetAvailableTimeslots } from "./functions/widget/get-available-timeslots";
export { widgetBookAppointment } from "./functions/widget/book-appointment";