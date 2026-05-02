import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import type { Part } from "genkit/model";
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
const IMAGE_MODEL = "gemini-2.5-flash-image";
const TEXT_TIMEOUT_MS = 45_000;
const MULTIMODAL_TIMEOUT_MS = 75_000;
const IMAGE_TIMEOUT_MS = 45_000;

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
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

function getBase64FromDataUrl(dataUrl: string): string {
  const [, base64] = dataUrl.split(",");

  if (!base64) {
    throw new Error("Invalid image data URL");
  }

  return base64;
}

function toImageDataUrl(payload: {
  data: string;
  mimeType?: string;
}): string {
  return `data:${payload.mimeType || "image/png"};base64,${payload.data}`;
}

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
          const response = await withTimeout(
            client.generate({
              model: googleAI.model(modelName),
              prompt: payload.prompt,
              config: {
                temperature: 0.1,
              },
            }),
            TEXT_TIMEOUT_MS,
            "Gemini prompt",
          );
          return response.text || "";
        },
        {
          maxRetries: 1,
          initialDelayMs: 500,
          maxDelayMs: 1500,
          backoffMultiplier: 2,
        },
      );

      loggerService.info("[Genkit] Prompt executed", {
        responseLength: text.length,
      });

      return text;
    },
    executeMultimodalPrompt: async (payload) => {
      loggerService.info("[Genkit] Executing multimodal prompt", {
        promptLength: payload.prompt.length,
        mediaContentType: payload.media.contentType,
        model: modelName,
      });

      const text = await retryWithBackoff(
        async () => {
          const prompt: Part[] = [
            { text: payload.prompt },
            {
              media: {
                url: payload.media.url,
                contentType: payload.media.contentType,
              },
            },
          ];
          const response = await withTimeout(
            client.generate({
              model: googleAI.model(modelName),
              prompt,
              config: {
                temperature: 0.1,
              },
            }),
            MULTIMODAL_TIMEOUT_MS,
            "Gemini multimodal prompt",
          );
          return response.text || "";
        },
        {
          maxRetries: 1,
          initialDelayMs: 500,
          maxDelayMs: 1500,
          backoffMultiplier: 2,
        },
      );

      loggerService.info("[Genkit] Multimodal prompt executed", {
        responseLength: text.length,
      });

      return text;
    },
    executeImageEdit: async (payload) => {
      loggerService.info("[Genkit] Executing image edit", {
        promptLength: payload.prompt.length,
        model: IMAGE_MODEL,
      });

      const imageDataUrl = await retryWithBackoff(
        async () => {
          const abortController = new AbortController();
          const abortTimeoutId = setTimeout(() => {
            abortController.abort(
              new Error(`Gemini image request timed out after ${IMAGE_TIMEOUT_MS}ms`),
            );
          }, IMAGE_TIMEOUT_MS);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              signal: abortController.signal,
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: payload.prompt },
                      {
                        inline_data: {
                          mime_type: payload.referenceImage.contentType,
                          data: getBase64FromDataUrl(
                            payload.referenceImage.dataUrl,
                          ),
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"],
                },
              }),
            },
          );
          clearTimeout(abortTimeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Gemini image request failed: ${response.status} ${errorText}`,
            );
          }

          const json = await response.json() as {
            candidates?: {
              content?: {
                parts?: {
                  inlineData?: { data?: string; mimeType?: string };
                  inline_data?: { data?: string; mime_type?: string };
                }[];
              };
            }[];
          };

          const parts = json.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            const inlineData = part.inlineData || part.inline_data;
            const data = inlineData?.data;
            const mimeType =
              "mimeType" in (inlineData || {})
                ? part.inlineData?.mimeType
                : part.inline_data?.mime_type;

            if (data) {
              return toImageDataUrl({ data, mimeType });
            }
          }

          throw new Error("Gemini image response did not include image data");
        },
        {
          maxRetries: 0,
          initialDelayMs: 800,
          maxDelayMs: 1200,
          backoffMultiplier: 2,
        },
      );

      loggerService.info("[Genkit] Image edit executed", {
        imageLength: imageDataUrl.length,
      });

      return imageDataUrl;
    },
  };
};
