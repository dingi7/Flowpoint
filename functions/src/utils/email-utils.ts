import { format } from "date-fns";
import { Customer } from "@/core";

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

export function formatAppointmentDateTime(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
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
  type: "confirmation" | "reminder",
  data: EmailTemplateData,
): string {
  const subjectLine = type === "confirmation" ? "Appointment Confirmed" : "Appointment Reminder";
  const greeting = type === "confirmation" 
    ? "Your appointment has been confirmed!" 
    : "This is a reminder about your upcoming appointment.";
  
  const headerColor = type === "confirmation" ? "#4a90e2" : "#f39c12";
  const borderColor = type === "confirmation" ? "#4a90e2" : "#f39c12";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .appointment-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${borderColor}; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subjectLine}</h1>
    </div>
    <div class="content">
      <p>Dear ${data.customerName},</p>
      <p>${greeting}</p>
      <div class="appointment-details">
        <div class="detail-row">
          <span class="detail-label">Service:</span> ${data.serviceName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span> ${data.appointmentDate}
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span> ${data.duration}
        </div>
        ${data.fee !== undefined ? `<div class="detail-row"><span class="detail-label">Fee:</span> $${data.fee.toFixed(2)}</div>` : ""}
      </div>
      ${data.organizationContactInfo?.address ? `<p><strong>Location:</strong> ${data.organizationContactInfo.address}</p>` : ""}
      ${data.organizationContactInfo?.phone ? `<p><strong>Phone:</strong> ${data.organizationContactInfo.phone}</p>` : ""}
      <p>If you need to reschedule or cancel your appointment, please contact us at ${data.organizationContactInfo?.email || "our support email"}.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>${data.organizationName}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildAppointmentEmailText(
  type: "confirmation" | "reminder",
  data: EmailTemplateData,
): string {
  const subjectLine = type === "confirmation" ? "Appointment Confirmed" : "Appointment Reminder";
  const greeting = type === "confirmation" 
    ? "Your appointment has been confirmed!" 
    : "This is a reminder about your upcoming appointment.";

  return `
${subjectLine}

Dear ${data.customerName},

${greeting}

Appointment Details:
- Service: ${data.serviceName}
- Date & Time: ${data.appointmentDate}
- Duration: ${data.duration}
${data.fee !== undefined ? `- Fee: $${data.fee.toFixed(2)}` : ""}
${data.organizationContactInfo?.address ? `- Location: ${data.organizationContactInfo.address}` : ""}
${data.organizationContactInfo?.phone ? `- Phone: ${data.organizationContactInfo.phone}` : ""}

If you need to reschedule or cancel your appointment, please contact us at ${data.organizationContactInfo?.email || "our support email"}.

Best regards,
${data.organizationName}
  `.trim();
}
