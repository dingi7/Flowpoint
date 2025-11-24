import { AuthenticationService } from "./authentication-service";
import { DatabaseService } from "./database-service";
import { FileUploadService } from "./file-upload-service";
import { FunctionsService } from "./functions-service";

export interface ServiceHost {
  getDatabaseService(): DatabaseService;
  getFunctionsService(): FunctionsService;
  getAuthenticationService(): AuthenticationService;
  getFileUploadService(): FileUploadService;
}
