import {
  GetMailgunServicePayload,
  MailgunService,
} from "@/core/ports/services/mailgun-service";
import formData from "form-data";
import Mailgun from "mailgun.js";

function getMailgunClient(apiKey: string) {
  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: "api",
    key: apiKey,
  });
}

export function getMailgunService(
  payload: GetMailgunServicePayload,
): MailgunService {
  const { apiKey } = payload;
  const mailgun = getMailgunClient(apiKey);
  return {
    sendEmail: async (payload) => {
      const response = await mailgun.messages.create('',payload);
      return response;
    },
  };
}
