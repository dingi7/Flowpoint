import { Appointment } from "@/core";

/**
 * Get the type of an appointment based on its title
 * @param appointment - The appointment to get the type for
 * @returns The appointment type: 'meeting', 'presentation', or 'personal'
 */
export function getAppointmentType(
  appointment: Appointment,
): "meeting" | "presentation" | "personal" {
  if (appointment.title?.toLowerCase().includes("meeting")) return "meeting";
  if (appointment.title?.toLowerCase().includes("presentation"))
    return "presentation";
  return "personal";
}
