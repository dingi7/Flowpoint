import {
  GetMailgunServicePayload,
  MailgunService,
} from "@/core/ports/services/mailgun-service";
import formData from "form-data";
import Mailgun from "mailgun.js";

function getMailgunClient(apiKey: string, url?: string) {
  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: "api",
    key: apiKey,
    ...(url ? { url } : {}), // Add URL if provided (for EU domains)
  });
}

export function getMailgunService(
  payload: GetMailgunServicePayload,
): MailgunService {
  const { apiKey, domain, url } = payload;
  const mailgun = getMailgunClient(apiKey, url);
  return {
    sendEmail: async (payload) => {
      const response = await mailgun.messages.create(domain, payload);
      return response;
    },
  };
}
