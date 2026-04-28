import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import { GenkitService, GetGenkitServicePayload, LoggerService } from "../core";

interface GetGenkitServiceDependencies {
  loggerService: LoggerService;
}

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> => {
  let attempt = 0;
  let delayMs = options.initialDelayMs;
  let lastError: unknown;

  while (attempt <= options.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === options.maxRetries) {
        break;
      }

      await sleep(delayMs);
      delayMs = Math.min(
        options.maxDelayMs,
        Math.round(delayMs * options.backoffMultiplier),
      );
      attempt++;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Genkit request failed after retries");
};

export const getGenkitService = (
  payload: GetGenkitServicePayload,
  dependencies: GetGenkitServiceDependencies,
): GenkitService => {
  const { apiKey } = payload;
  const { loggerService } = dependencies;

  const modelName = DEFAULT_MODEL;

  const client = genkit({
    plugins: [
      googleAI({
        apiKey,
      }),
    ],
  });

  return {
    executePrompt: async (payload) => {
      loggerService.info("[Genkit] Executing prompt", {
        promptLength: payload.prompt.length,
        model: modelName,
      });

      const text = await retryWithBackoff(
        async () => {
          const response = await client.generate({
            model: googleAI.model(modelName),
            prompt: payload.prompt,
            config: {
              temperature: 0.1,
            },
          });
          return response.text || "";
        },
        {
          maxRetries: 4,
          initialDelayMs: 500,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
        },
      );

      loggerService.info("[Genkit] Prompt executed", {
        responseLength: text.length,
      });

      return text;
    },
  };
};
