import { formatInTimeZone } from "date-fns-tz";
import { Customer, EmailTemplate } from "@/core";
import { getDefaultEmailTemplate, renderTemplate } from "./template-renderer";

export interface EmailTemplateData {
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  duration: string;
  fee: number | undefined;
  organizationName: string;
  organizationContactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
  };
}

const SOFIA_TIMEZONE = "Europe/Sofia";

export function getCustomerTimezone(customer: Customer | null | undefined): string {
  if (customer?.timezone) {
    return customer.timezone;
  }
  return SOFIA_TIMEZONE;
}

export function formatAppointmentDateTime(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  // Convert UTC date to the specified timezone
  return formatInTimeZone(date, timezone, "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} minutes`;
  }
  if (mins === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} minutes`;
}

export function getCustomerName(customer: Customer): string {
  const nameFromCustomFields = customer.customFields.name;
  if (typeof nameFromCustomFields === "string" && nameFromCustomFields.trim()) {
    return nameFromCustomFields;
  }
  return customer.email.split("@")[0];
}

export function buildAppointmentEmailHtml(
  type: "confirmation" | "reminder" | "info",
  data: EmailTemplateData,
  customTemplate?: EmailTemplate,
): string {
  if (customTemplate?.html) {
    return renderTemplate(customTemplate.html, data);
  }

  const defaultTemplate = getDefaultEmailTemplate(type);
  return renderTemplate(defaultTemplate.html, data);
}

export function buildAppointmentEmailText(
  type: "confirmation" | "reminder" | "info",
  data: EmailTemplateData,
  customTemplate?: EmailTemplate,
): string {
  if (customTemplate?.text) {
    return renderTemplate(customTemplate.text, data);
  }

  const defaultTemplate = getDefaultEmailTemplate(type);
  return renderTemplate(defaultTemplate.text, data);
}

export function buildAppointmentEmailSubject(
  type: "confirmation" | "reminder" | "info",
  data: EmailTemplateData,
  customTemplate?: EmailTemplate,
): string {
  if (customTemplate?.subject) {
    return renderTemplate(customTemplate.subject, data);
  }

  const defaultTemplate = getDefaultEmailTemplate(type);
  return renderTemplate(defaultTemplate.subject, data);
}
