import z from "zod";
import { baseEntitySchema } from "./base";

export enum WEBHOOK_SUBSCRIPTION_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum WEBHOOK_EVENT_TYPE {
  CUSTOMER_CREATED = "customer.created",
  CUSTOMER_UPDATED = "customer.updated",
  CUSTOMER_DELETED = "customer.deleted",
  APPOINTMENT_CREATED = "appointment.created",
  APPOINTMENT_UPDATED = "appointment.updated",
  APPOINTMENT_DELETED = "appointment.deleted",
  SERVICE_CREATED = "service.created",
  SERVICE_UPDATED = "service.updated",
  SERVICE_DELETED = "service.deleted",
  MEMBER_CREATED = "member.created",
  MEMBER_UPDATED = "member.updated",
  MEMBER_DELETED = "member.deleted",
  INVITE_CREATED = "invite.created",
  INVITE_UPDATED = "invite.updated",
  INVITE_DELETED = "invite.deleted",
}

export const webhookSubscriptionDataSchema = z.object({
  eventTypes: z.array(z.nativeEnum(WEBHOOK_EVENT_TYPE)),
  callbackUrl: z.string(),
  secretId: z.string(), // Reference to secret stored in Secret Manager
  status: z.nativeEnum(WEBHOOK_SUBSCRIPTION_STATUS),
});

export type WebhookSubscriptionData = z.infer<
  typeof webhookSubscriptionDataSchema
>;
export const webhookSubscriptionSchema = baseEntitySchema.merge(
  webhookSubscriptionDataSchema,
);
export type WebhookSubscription = z.infer<typeof webhookSubscriptionSchema>;
