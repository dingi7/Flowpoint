import { MailgunMessageData, MessagesSendResult } from "mailgun.js/Types/Messages/Messages";

export interface GetMailgunServicePayload {
  apiKey: string;
}

export interface MailgunService {
  sendEmail(
    payload: MailgunMessageData,
  ): Promise<MessagesSendResult>;
}
