import { GenkitService, LoggerService } from "@/core";
import {
  getImageContentType,
  hairstyleRecommendationSchema,
} from "./analyze-hairstyle";
import z from "zod";

const generateHairstylePreviewPayloadSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((value) => /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value), {
      message: "Image must be a JPEG, PNG, or WebP data URL",
    }),
  locale: z.enum(["en", "bg", "tr"]).default("en"),
  recommendation: hairstyleRecommendationSchema.omit({
    previewImageDataUrl: true,
  }),
});

type GenerateHairstylePreviewPayload = z.infer<
  typeof generateHairstylePreviewPayloadSchema
>;

interface Dependencies {
  genkitService?: GenkitService;
  loggerService: LoggerService;
}

function buildImagePrompt(payload: {
  recommendation: GenerateHairstylePreviewPayload["recommendation"];
  locale: GenerateHairstylePreviewPayload["locale"];
}): string {
  return [
    "Create a realistic hairstyle preview using the attached reference photo.",
    "Preserve the person's face, identity, facial expression, pose, skin texture, and background as much as possible.",
    "Change only the hair and grooming or styling details needed to visualize this recommendation.",
    "Do not beautify, age, gender-swap, change ethnicity, alter facial structure, or infer sensitive traits.",
    `Hairstyle: ${payload.recommendation.title}.`,
    `Why it fits: ${payload.recommendation.reason}.`,
    `Styling details: ${payload.recommendation.stylingNotes}.`,
    `Return one natural-looking image only. Locale for any visual text, if unavoidable: ${payload.locale}.`,
  ].join("\n");
}

export async function generateHairstylePreviewFn(
  payload: GenerateHairstylePreviewPayload,
  dependencies: Dependencies,
): Promise<{ previewImageDataUrl?: string }> {
  const validatedPayload = generateHairstylePreviewPayloadSchema.parse(payload);
  const { genkitService, loggerService } = dependencies;

  if (!genkitService) {
    return {};
  }

  try {
    const previewImageDataUrl = await genkitService.executeImageEdit({
      prompt: buildImagePrompt({
        recommendation: validatedPayload.recommendation,
        locale: validatedPayload.locale,
      }),
      referenceImage: {
        dataUrl: validatedPayload.imageDataUrl,
        contentType: getImageContentType(validatedPayload.imageDataUrl),
      },
    });

    return { previewImageDataUrl };
  } catch (error) {
    loggerService.warn("Hairstyle preview generation failed", {
      title: validatedPayload.recommendation.title,
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}
