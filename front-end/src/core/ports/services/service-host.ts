import { AuthenticationService } from "./authentication-service";
import { DatabaseService } from "./database-service";
import { FunctionsService } from "./functions-service";

export interface ServiceHost {
  getDatabaseService(): DatabaseService;
  getFunctionsService(): FunctionsService;
  getAuthenticationService(): AuthenticationService;
}
