import type { ServiceHost } from "../core";
import { authService } from "./auth-service";
import { clerkService } from "./clerk-service";
import { databaseService } from "./database-service";
import { loggerService } from "./logger-service";
import { pubSubService } from "./pub-sub-service";

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
};
