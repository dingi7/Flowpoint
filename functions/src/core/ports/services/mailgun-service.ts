import { MailgunMessageData, MessagesSendResult } from "mailgun.js/definitions";

export interface GetMailgunServicePayload {
  apiKey: string;
  domain: string;
  url?: string; // Optional Mailgun API URL (e.g., "https://api.eu.mailgun.net" for EU domains)
}

export interface MailgunService {
  sendEmail(
    payload: MailgunMessageData,
  ): Promise<MessagesSendResult>;
}
