import { ServiceHost } from "@/core";
import { databaseService } from "./database/database-service";
import { functionsService } from "./functions/functions-service";
import { fileUploadService } from "./file-upload/file-upload-service";

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
  getFileUploadService() {
    return fileUploadService;
  },
};
