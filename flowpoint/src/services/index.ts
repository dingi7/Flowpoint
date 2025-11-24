import { ServiceHost } from "@/core";
import { authenticationService } from "./authentication/authentication-service";
import { databaseService } from "./database/database-service";
import { fileUploadService } from "./file-upload/file-upload-service";
import { functionsService } from "./functions/functions-service";

/**
 * Service Host
 *
 * @export
 * @interface ServiceHost
 */
export const serviceHost: ServiceHost = {
  /**
   * Get database service
   *
   * @returns {DatabaseService}
   */
  getDatabaseService() {
    return databaseService;
  },
  getFunctionsService() {
    return functionsService;
  },
  getAuthenticationService() {
    return authenticationService;
  },
  getFileUploadService() {
    return fileUploadService;
  },
};
