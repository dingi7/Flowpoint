import { getApps, initializeApp } from "firebase-admin/app";

/**
 * Initialize Firebase app
 */
if (!getApps().length) {
  initializeApp();
}

export { onClerkWebhookEvent } from "./functions/clerk/on-clerk-event-webhook-dev";
export { onClerkWebhookEventProd } from "./functions/clerk/on-clerk-event-webhook-prod";
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

// <-- Webhook Management -->
export { createWebhookSubscription } from "./functions/api/webhooks/create-webhook-subscription";
export { removeWebhookSubscription } from "./functions/api/webhooks/remove-webhook-subscription";
export { onCustomerChange } from "./functions/webhooks/on-customer-change";
export { onAppointmentChange } from "./functions/webhooks/on-appointment-change";
export { onServiceChange } from "./functions/webhooks/on-service-change";
export { onMemberChange } from "./functions/webhooks/on-member-change";
export { onInviteChange } from "./functions/webhooks/on-invite-change";

// <-- Widget Public API -->
export { widgetGetOrganizationServices } from "./functions/widget/get-organization-services";
export { widgetGetOrganizationMembers } from "./functions/widget/get-organization-members";
export { widgetGetAvailableTimeslots } from "./functions/widget/get-available-timeslots";
export { widgetBookAppointment } from "./functions/widget/book-appointment";

// <-- API Key Authenticated API -->
// Read operations (widget equivalents)
export { apiGetOrganizationServices } from "./functions/api/get-organization-services";
export { apiGetAvailableTimeslots } from "./functions/api/get-available-timeslots";
export { apiBookAppointment } from "./functions/api/book-appointment";

// Services CRUD
export { apiCreateService } from "./functions/api/services/create-service";
export { apiGetService } from "./functions/api/services/get-service";
export { apiListServices } from "./functions/api/services/list-services";
export { apiUpdateService } from "./functions/api/services/update-service";
export { apiDeleteService } from "./functions/api/services/delete-service";

// Appointments CRUD
export { apiCreateAppointment } from "./functions/api/appointments/create-appointment";
export { apiGetAppointment } from "./functions/api/appointments/get-appointment";
export { apiListAppointments } from "./functions/api/appointments/list-appointments";
export { apiUpdateAppointment } from "./functions/api/appointments/update-appointment";
export { apiDeleteAppointment } from "./functions/api/appointments/delete-appointment";