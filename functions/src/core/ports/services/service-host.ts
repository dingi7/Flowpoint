import type { AuthenticationService } from "./authentication-service";
import type { ClerkService } from "./clerk-service";
import type { CloudTasksService } from "./cloud-tasks-service";
import type { DatabaseService } from "./database-service";
import type { GetMailgunServicePayload, MailgunService } from "./mailgun-service";
import type { LoggerService } from "./logger-service";
import type { PubSubService } from "./pub-sub-service";
import type { GetSecretManagerServiceDependencies, SecretManagerService } from "./secret-manager-service";

export interface ServiceHost {
  getAuthenticationService: () => AuthenticationService;
  getClerkService: () => ClerkService;
  getDatabaseService: () => DatabaseService;
  getLoggerService: () => LoggerService;
  getPubSubService: () => PubSubService;
  getMailgunService: (payload: GetMailgunServicePayload) => MailgunService;
  getCloudTasksService: (functionName: string) => CloudTasksService;
  getSecretManagerService: (dependencies: GetSecretManagerServiceDependencies) => SecretManagerService;
}
