import { EmailTemplateData } from "./email-utils";
import { formatPrice } from "./price-format";

/**
 * Available template variables for email templates
 */
export const EMAIL_TEMPLATE_VARIABLES = {
  customerName: "{{customerName}}",
  serviceName: "{{serviceName}}",
  appointmentDate: "{{appointmentDate}}",
  duration: "{{duration}}",
  fee: "{{fee}}",
  organizationName: "{{organizationName}}",
  organizationAddress: "{{organizationAddress}}",
  organizationPhone: "{{organizationPhone}}",
  organizationEmail: "{{organizationEmail}}",
} as const;

export type TemplateVariable = keyof typeof EMAIL_TEMPLATE_VARIABLES;

/**
 * Render a template string by replacing variables with actual values
 * Supports {{variable}} syntax and {{#if variable}}...{{/if}} conditionals
 */
export function renderTemplate(
  template: string,
  data: EmailTemplateData,
): string {
  if (!template) {
    return "";
  }

  let rendered = template;

  // Process conditional blocks first ({{#if variable}}...{{/if}})
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(conditionalRegex, (match, variable, content) => {
    let shouldInclude = false;

    switch (variable) {
      case "fee":
        shouldInclude = data.fee !== undefined;
        break;
      case "organizationAddress":
        shouldInclude = !!data.organizationContactInfo?.address;
        break;
      case "organizationPhone":
        shouldInclude = !!data.organizationContactInfo?.phone;
        break;
      case "organizationEmail":
        shouldInclude = !!data.organizationContactInfo?.email;
        break;
      default:
        shouldInclude = false;
    }

    return shouldInclude ? content : "";
  });

  // Replace all template variables
  rendered = rendered.replace(/\{\{customerName\}\}/g, data.customerName || "");
  rendered = rendered.replace(/\{\{serviceName\}\}/g, data.serviceName || "");
  rendered = rendered.replace(/\{\{appointmentDate\}\}/g, data.appointmentDate || "");
  rendered = rendered.replace(/\{\{duration\}\}/g, data.duration || "");
  rendered = rendered.replace(
    /\{\{fee\}\}/g,
    data.fee !== undefined ? formatPrice(data.fee) : "",
  );
  rendered = rendered.replace(/\{\{organizationName\}\}/g, data.organizationName || "");
  rendered = rendered.replace(
    /\{\{organizationAddress\}\}/g,
    data.organizationContactInfo?.address || "",
  );
  rendered = rendered.replace(
    /\{\{organizationPhone\}\}/g,
    data.organizationContactInfo?.phone || "",
  );
  rendered = rendered.replace(
    /\{\{organizationEmail\}\}/g,
    data.organizationContactInfo?.email || "",
  );

  return rendered;
}

/**
 * Get default email template for a given type
 */
export function getDefaultEmailTemplate(
  type: "confirmation" | "reminder" | "info",
): { subject: string; html: string; text: string } {
  let subjectLine: string;
  let greeting: string;
  let headerColor: string;
  let borderColor: string;

  if (type === "confirmation") {
    subjectLine = "Appointment Confirmed";
    greeting = "Your appointment has been confirmed!";
    headerColor = "#4a90e2";
    borderColor = "#4a90e2";
  } else if (type === "reminder") {
    subjectLine = "Appointment Reminder";
    greeting = "This is a reminder about your upcoming appointment.";
    headerColor = "#f39c12";
    borderColor = "#f39c12";
  } else {
    // info type for assignees
    subjectLine = "New Appointment Assigned";
    greeting = "You have been assigned a new appointment.";
    headerColor = "#27ae60";
    borderColor = "#27ae60";
  }

  const html = `
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
      ${type === "info" ? "" : "<p>Dear {{customerName}},</p>"}
      <p>${greeting}</p>
      <div class="appointment-details">
        ${type === "info" ? "<div class=\"detail-row\"><span class=\"detail-label\">Customer:</span> {{customerName}}</div>" : ""}
        <div class="detail-row">
          <span class="detail-label">Service:</span> {{serviceName}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span> {{appointmentDate}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span> {{duration}}
        </div>
        {{#if fee}}
        <div class="detail-row">
          <span class="detail-label">Fee:</span> {{fee}}
        </div>
        {{/if}}
      </div>
      {{#if organizationAddress}}
      <p><strong>Location:</strong> {{organizationAddress}}</p>
      {{/if}}
      {{#if organizationPhone}}
      <p><strong>Phone:</strong> {{organizationPhone}}</p>
      {{/if}}
      ${type === "info" ? "" : "<p>If you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}.</p>"}
    </div>
    <div class="footer">
      <p>Best regards,<br>{{organizationName}}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${subjectLine}
${type === "info" ? "" : "\nDear {{customerName}},\n"}
${greeting}

Appointment Details:
${type === "info" ? "- Customer: {{customerName}}\n" : ""}- Service: {{serviceName}}
- Date & Time: {{appointmentDate}}
- Duration: {{duration}}
{{#if fee}}- Fee: {{fee}}{{/if}}
{{#if organizationAddress}}- Location: {{organizationAddress}}{{/if}}
{{#if organizationPhone}}- Phone: {{organizationPhone}}{{/if}}
${type === "info" ? "" : "\nIf you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}."}

Best regards,
{{organizationName}}
  `.trim();

  return {
    subject: type === "info" 
      ? `New Appointment - {{serviceName}} with {{customerName}}`
      : `${subjectLine} - {{serviceName}}`,
    html,
    text,
  };
}

