import { LoggerService } from "./logger-service";

export interface GetSecretManagerServiceDependencies {
  loggerService: LoggerService;
}

export interface SecretManagerService {
  getSecret(secretId: string): Promise<string | null>;
  createSecret(secretId: string, secretValue: string): Promise<void>;
  deleteSecret(secretId: string): Promise<void>;
}
