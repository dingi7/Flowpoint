import { CloudTasksClient } from "@google-cloud/tasks";
import {
  CloudTasksService,
  ScheduleTaskPayload,
} from "@/core/ports/services/cloud-tasks-service";

function getCloudTasksClient() {
  return new CloudTasksClient();
}

function getQueuePath(projectId: string, location: string, queueName: string) {
  return getCloudTasksClient().queuePath(projectId, location, queueName);
}

function getFunctionUrl(functionName: string): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
  const region = process.env.FUNCTION_REGION || process.env.LOCATION || "us-central1";
  
  if (!projectId) {
    throw new Error("GCLOUD_PROJECT environment variable is not set");
  }
  
  return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
}

/**
 * Creates a Cloud Tasks queue if it doesn't exist
 */
async function ensureQueueExists(
  client: CloudTasksClient,
  projectId: string,
  location: string,
  queueName: string,
): Promise<void> {
  const queuePath = getQueuePath(projectId, location, queueName);
  
  try {
    await client.getQueue({ name: queuePath });
  } catch (error: any) {
    if (error.code === 5 || error.code === "NOT_FOUND") {
      try {
        const parent = client.locationPath(projectId, location);
        await client.createQueue({
          parent,
          queue: {
            name: queuePath,
          },
        });
      } catch (createError: any) {
        throw new Error(
          `Failed to create Cloud Tasks queue '${queueName}'. ` +
          `Please create it manually using: ` +
          `gcloud tasks queues create ${queueName} --location=${location}. ` +
          `Error: ${createError.message}`,
        );
      }
    } else {
      throw error;
    }
  }
}

export function getCloudTasksService(functionName: string): CloudTasksService {
  const client = getCloudTasksClient();
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
  const location = process.env.LOCATION || "us-central1";
  const queueName = "appointment-reminders";

  return {
    scheduleTask: async (payload: ScheduleTaskPayload): Promise<string> => {
      if (!projectId) {
        throw new Error("GCLOUD_PROJECT environment variable is not set");
      }

      const queuePath = getQueuePath(projectId, location, queueName);
      
      // Ensure queue exists before scheduling task
      await ensureQueueExists(client, projectId, location, queueName);
      
      // Generate URL if not provided
      const url = payload.url || getFunctionUrl(functionName);
      
      const task = {
        httpRequest: {
          httpMethod: "POST" as const,
          url,
          headers: {
            "Content-Type": "application/json",
          },
          body: Buffer.from(JSON.stringify(payload.payload)).toString("base64"),
        },
        scheduleTime: {
          seconds: Math.floor(payload.scheduleTime.getTime() / 1000),
        },
      };

      const [response] = await client.createTask({
        parent: queuePath,
        task,
      });

      if (!response.name) {
        throw new Error("Failed to create Cloud Task");
      }

      return response.name;
    },
  };
}