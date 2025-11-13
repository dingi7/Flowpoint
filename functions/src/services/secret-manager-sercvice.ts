import {
  GetSecretManagerServiceDependencies,
  SecretManagerService,
} from "@/core";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { GCP_PROJECT_ID } from "@/config/gcp";

export function getSecretManagerService(
  dependencies: GetSecretManagerServiceDependencies,
): SecretManagerService {
  const { loggerService } = dependencies;

  const secretManagerClient = new SecretManagerServiceClient();

  const parent = `projects/${GCP_PROJECT_ID}`;

  return {
    async getSecret(secretId: string): Promise<string | null> {
      const [version] = await secretManagerClient.accessSecretVersion({
        name: `${parent}/secrets/${secretId}/versions/latest`,
      });
      return version.payload?.data?.toString() || null;
    },
    async createSecret(secretId: string, secretValue: string): Promise<void> {
      try {
        await secretManagerClient.createSecret({
          parent: parent,
          secretId: secretId,
          secret: {
            name: secretId,
            labels: {
              createdBy: "system",
            },
            replication: {
              automatic: {}, // Use automatic replication
            },
          },
        });
      } catch (error) {
        loggerService.error(error);
        if (
          !(error instanceof Error) ||
          !error.message.includes("ALREADY_EXISTS")
        ) {
          throw new Error(`Failed to create secret ${secretId}`);
        }
      }
      const [version] = await secretManagerClient.addSecretVersion({
        parent: `${parent}/secrets/${secretId}`,
        payload: {
          data: Buffer.from(secretValue, "utf8"),
        },
      });
      loggerService.info(`Added secret version: ${version.name}`);
    },
    async deleteSecret(secretId: string): Promise<void> {
      try {
        await secretManagerClient.deleteSecret({
          name: `${parent}/secrets/${secretId}`,
        });
      } catch (error) {
        loggerService.error(error);
        if (!(error instanceof Error) || !error.message.includes("NOT_FOUND")) {
          loggerService.error(`Secret ${secretId} not deleted`);
          throw new Error(`Failed to delete secret ${secretId}`);
        } else {
          loggerService.info(`Secret ${secretId} not found`);
          throw new Error(`Secret ${secretId} not found`);
        }
      }
    },
  };
}
