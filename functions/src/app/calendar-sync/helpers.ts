import { Appointment } from "@/core";
import { createHash, randomBytes } from "crypto";

export function buildCalendarSyncEventId(
  organizationId: string,
  memberId: string,
  appointmentId: string,
): string {
  return createHash("sha256")
    .update(`${organizationId}:${memberId}:${appointmentId}`)
    .digest("hex")
    .slice(0, 64);
}

export function createRandomToken(size: number = 32): string {
  return randomBytes(size).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildAppointmentLink(baseUrl: string, appointmentId: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/appointments?id=${encodeURIComponent(appointmentId)}`;
}

export function calculateEndTime(appointment: Appointment): string {
  const start = new Date(appointment.startTime);
  return new Date(start.getTime() + appointment.duration * 60 * 1000).toISOString();
}

export function isInvalidGrantError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return normalized.includes("invalid_grant");
}
