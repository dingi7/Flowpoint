import type { AuthenticationService } from "./authentication-service";
import type { ClerkService } from "./clerk-service";
import type { DatabaseService } from "./database-service";
import type { LoggerService } from "./logger-service";
import type { PubSubService } from "./pub-sub-service";

export interface ServiceHost {
  getAuthenticationService: () => AuthenticationService;
  getClerkService: () => ClerkService;
  getDatabaseService: () => DatabaseService;
  getLoggerService: () => LoggerService;
  getPubSubService: () => PubSubService;
}
