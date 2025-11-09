import type { GetSecretManagerServiceDependencies, ServiceHost } from "@/core";
import { authService } from "./auth-service";
import { clerkService } from "./clerk-service";
import { databaseService } from "./database-service";
import { loggerService } from "./logger-service";
import { pubSubService } from "./pub-sub-service";
import { getMailgunService } from "./mailgun-service";
import { GetMailgunServicePayload } from "@/core/ports/services/mailgun-service";
import { getCloudTasksService } from "./cloud-tasks-service";
import { getSecretManagerService } from "./secret-manager-sercvice";

export const serviceHost: ServiceHost = {
  getAuthenticationService() {
    return authService;
  },
  getClerkService() {
    return clerkService;
  },
  getDatabaseService() {
    return databaseService;
  },
  getLoggerService() {
    return loggerService;
  },
  getPubSubService() {
    return pubSubService;
  },
  getMailgunService(payload: GetMailgunServicePayload) {
    return getMailgunService(payload);
  },
  getCloudTasksService(functionName: string) {
    return getCloudTasksService(functionName);
  },
  getSecretManagerService(dependencies: GetSecretManagerServiceDependencies) {
    return getSecretManagerService(dependencies);
  },
};
