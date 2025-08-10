import * as logger from "firebase-functions/logger";

import { LoggerService } from "@/core";

export const loggerService: LoggerService = {
  info(...args: any[]) {
    logger.info(...args);
  },
  warn(...args: any[]) {
    logger.warn(...args);
  },
  error(...args: any[]) {
    logger.error(...args);
  },
  debug(...args: any[]) {
    logger.debug(...args);
  },
};
