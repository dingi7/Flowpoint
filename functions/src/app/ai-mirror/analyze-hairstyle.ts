import {
  GenkitService,
  LoggerService,
  Service,
  ServiceRepository,
} from "@/core";
import z from "zod";

const MAX_IMAGE_DATA_URL_LENGTH = 7_500_000;

const analyzeHairstylePayloadSchema = z.object({
  organizationId: z.string().min(1),
  imageDataUrl: z
    .string()
    .min(1)
    .max(MAX_IMAGE_DATA_URL_LENGTH, {
      message: "Image is too large. Please upload an image under 5MB.",
    })
    .refine((value) => /^data:image\/(jpeg|png|webp);base64,/.test(value), {
      message: "Image must be a JPEG, PNG, or WebP data URL",
    }),
  locale: z.enum(["en", "bg", "tr"]).default("en"),
});

const hairstyleRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  matchedServiceId: z.string().optional(),
  reason: z.string().min(1).max(240),
  stylingNotes: z.string().min(1).max(240),
  maintenanceLevel: z.enum(["low", "medium", "high"]),
  bookingLabel: z.string().min(1).max(80),
  previewImageDataUrl: z.string().optional(),
});

const analyzeHairstyleResponseSchema = z.object({
  status: z.enum(["ok", "needs_better_photo"]),
  analysisSummary: z.object({
    faceShape: z.string().max(80).optional(),
    visibleHairNotes: z.array(z.string().max(120)).max(4),
    imageQualityNotes: z.array(z.string().max(120)).max(4),
  }),
  recommendations: z.array(hairstyleRecommendationSchema).max(3),
});

type AnalyzeHairstylePayload = z.infer<typeof analyzeHairstylePayloadSchema>;

export type AnalyzeHairstyleResponse = z.infer<
  typeof analyzeHairstyleResponseSchema
>;

interface Dependencies {
  genkitService?: GenkitService;
  loggerService: LoggerService;
  serviceRepository: ServiceRepository;
}

function extractJsonObject(payload: { text: string }): unknown {
  const trimmed = payload.text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function getImageContentType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
  if (!match) {
    throw new Error("Unsupported image data URL");
  }
  return match[1];
}

function buildFallbackResponse(services: Service[]): AnalyzeHairstyleResponse {
  const recommendations = services.slice(0, 3).map((service) => ({
    title: service.name,
    matchedServiceId: service.id,
    reason: "A versatile option from this location's service menu.",
    stylingNotes: service.description || "Ask the stylist to adapt the finish to your hair length and daily routine.",
    maintenanceLevel: "medium" as const,
    bookingLabel: `Book ${service.name}`,
  }));

  return {
    status: recommendations.length > 0 ? "ok" : "needs_better_photo",
    analysisSummary: {
      visibleHairNotes: [],
      imageQualityNotes:
        recommendations.length > 0
          ? ["AI analysis was unavailable, so recommendations used the service menu."]
          : ["No services were available for recommendations."],
    },
    recommendations,
  };
}

function normalizeRecommendations(payload: {
  response: AnalyzeHairstyleResponse;
  services: Service[];
}): AnalyzeHairstyleResponse {
  const serviceIds = new Set(payload.services.map((service) => service.id));

  return {
    ...payload.response,
    recommendations: payload.response.recommendations
      .map((recommendation) => ({
        ...recommendation,
        matchedServiceId:
          recommendation.matchedServiceId &&
          serviceIds.has(recommendation.matchedServiceId)
            ? recommendation.matchedServiceId
            : undefined,
      }))
      .slice(0, 3),
  };
}

function buildPrompt(payload: {
  locale: AnalyzeHairstylePayload["locale"];
  services: Service[];
}): string {
  return [
    "You are a hairstyle recommendation assistant for a booking flow.",
    "Analyze only visible hairstyle-relevant features from the uploaded image: face shape, visible hair length, hair volume, hairline visibility, and face-hair interaction if visible.",
    "Do not identify the person. Do not infer age, gender identity, ethnicity, health, attractiveness, or other protected or sensitive traits.",
    "If the face or hair is too unclear for useful styling advice, return status needs_better_photo and explain the image quality issue.",
    "Return only valid JSON matching this exact shape:",
    '{"status":"ok|needs_better_photo","analysisSummary":{"faceShape":"optional short phrase","visibleHairNotes":["note"],"imageQualityNotes":["note"]},"recommendations":[{"title":"style name","matchedServiceId":"optional service id","reason":"why it fits visible structure","stylingNotes":"how to ask/style it","maintenanceLevel":"low|medium|high","bookingLabel":"short CTA"}]}',
    `Respond in locale: ${payload.locale}.`,
    `Available services: ${JSON.stringify(
      payload.services.map((service) => ({
        id: service.id,
        name: service.name,
      })),
    )}`,
  ].join("\n");
}

export async function analyzeHairstyleFn(
  payload: AnalyzeHairstylePayload,
  dependencies: Dependencies,
): Promise<AnalyzeHairstyleResponse> {
  const validatedPayload = analyzeHairstylePayloadSchema.parse(payload);
  const { genkitService, loggerService, serviceRepository } = dependencies;

  const services = await serviceRepository.getAll({
    organizationId: validatedPayload.organizationId,
  });

  if (!genkitService) {
    return buildFallbackResponse(services);
  }

  try {
    const response = await genkitService.executeMultimodalPrompt({
      prompt: buildPrompt({
        locale: validatedPayload.locale,
        services,
      }),
      media: {
        url: validatedPayload.imageDataUrl,
        contentType: getImageContentType(validatedPayload.imageDataUrl),
      },
    });
    const parsed = extractJsonObject({ text: response });
    const validatedResponse = analyzeHairstyleResponseSchema.parse(parsed);

    const normalizedResponse = normalizeRecommendations({
      response: validatedResponse,
      services,
    });

    return normalizedResponse;
  } catch (error) {
    loggerService.warn("AI hairstyle analysis failed; using fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildFallbackResponse(services);
  }
}

export {
  hairstyleRecommendationSchema,
  getImageContentType,
  MAX_IMAGE_DATA_URL_LENGTH,
};
