"use client";

import { Button } from "../ui/button";
import { Check, Loader2, Sparkles, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { HairstyleRecommendation, Service } from "@/core";
import {
  useAnalyzeHairstyle,
  useGenerateHairstylePreview,
} from "@/hooks";
import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";
import { prepareAiMirrorImage } from "@/utils/ai-mirror-image";
import { slideAnimation } from "./animations";
import Image from "next/image";

interface AiMirrorStepProps {
  direction: number;
  services: Service[];
  onSkip: () => void;
  onBack: () => void;
  onRecommendationSelect: (recommendation: HairstyleRecommendation) => void;
}

export function AiMirrorStep({
  direction,
  services,
  onSkip,
  onBack,
  onRecommendationSelect,
}: AiMirrorStepProps) {
  const { t, locale } = useTranslation();
  const analyzeHairstyle = useAnalyzeHairstyle();
  const generateHairstylePreview = useGenerateHairstylePreview();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreviews, setGeneratedPreviews] = useState<
    Record<string, string>
  >({});
  const [previewsCompleted, setPreviewsCompleted] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const previewBatchKeyRef = useRef<string | null>(null);
  const generatePreviewRef = useRef(generateHairstylePreview.mutateAsync);
  const progressCeilingRef = useRef(0);

  const ASSUMED_RECOMMENDATION_COUNT = 3;
  const PROGRESS_TICK_MS = 500;
  const PROGRESS_TICK_DELTA = 1;

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    generatePreviewRef.current = generateHairstylePreview.mutateAsync;
  }, [generateHairstylePreview.mutateAsync]);

  const getRecommendationKey = (recommendation: HairstyleRecommendation) =>
    `${recommendation.title}-${recommendation.matchedServiceId || "custom"}`;

  const analysis = analyzeHairstyle.data;
  const recommendations = useMemo(
    () => analysis?.recommendations || [],
    [analysis?.recommendations],
  );

  useEffect(() => {
    if (
      !imageDataUrl ||
      !analysis ||
      analysis.status !== "ok" ||
      recommendations.length === 0
    ) {
      previewBatchKeyRef.current = null;
      setGeneratedPreviews({});
      setPreviewsCompleted(0);
      return;
    }

    const imageFingerprint = `${imageDataUrl.length}:${imageDataUrl.slice(0, 64)}:${imageDataUrl.slice(-64)}`;
    const batchKey = JSON.stringify({
      imageFingerprint,
      locale,
      recommendations: recommendations.map((recommendation) => ({
        title: recommendation.title,
        matchedServiceId: recommendation.matchedServiceId,
        reason: recommendation.reason,
        stylingNotes: recommendation.stylingNotes,
        maintenanceLevel: recommendation.maintenanceLevel,
        bookingLabel: recommendation.bookingLabel,
      })),
    });

    if (previewBatchKeyRef.current === batchKey) {
      return;
    }

    previewBatchKeyRef.current = batchKey;

    let isCancelled = false;

    setGeneratedPreviews({});
    setPreviewsCompleted(0);

    const generateAllInParallel = async () => {
      await Promise.allSettled(
        recommendations.map(async (recommendation) => {
          const recommendationKey = getRecommendationKey(recommendation);
          try {
            const result = await generatePreviewRef.current({
              imageDataUrl,
              locale,
              recommendation: {
                title: recommendation.title,
                matchedServiceId: recommendation.matchedServiceId,
                reason: recommendation.reason,
                stylingNotes: recommendation.stylingNotes,
                maintenanceLevel: recommendation.maintenanceLevel,
                bookingLabel: recommendation.bookingLabel,
              },
            });

            if (!isCancelled && result.previewImageDataUrl) {
              const previewImageDataUrl = result.previewImageDataUrl;
              setGeneratedPreviews((current) => ({
                ...current,
                [recommendationKey]: previewImageDataUrl,
              }));
            }
          } catch (previewError) {
            console.warn("AI mirror preview generation failed", {
              title: recommendation.title,
              error: previewError,
            });
          } finally {
            if (!isCancelled) {
              setPreviewsCompleted((current) => current + 1);
            }
          }
        }),
      );
    };

    void generateAllInParallel();

    return () => {
      isCancelled = true;
    };
  }, [
    analysis,
    imageDataUrl,
    locale,
    recommendations,
  ]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    analyzeHairstyle.reset();
    setGeneratedPreviews({});
    setPreviewsCompleted(0);
    previewBatchKeyRef.current = null;

    try {
      const preparedImage = await prepareAiMirrorImage(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setImageDataUrl(preparedImage.dataUrl);
      setPreviewUrl(preparedImage.previewUrl);
    } catch (imageError) {
      setImageDataUrl(null);
      setPreviewUrl(null);
      setError(
        imageError instanceof Error
          ? imageError.message
          : t("aiMirror.errors.image"),
      );
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setImageDataUrl(null);
    setError(null);
    analyzeHairstyle.reset();
    setGeneratedPreviews({});
    setPreviewsCompleted(0);
    previewBatchKeyRef.current = null;
  };

  const handleAnalyze = () => {
    if (!imageDataUrl) {
      setError(t("aiMirror.errors.missingImage"));
      return;
    }

    if (!hasConsent) {
      setError(t("aiMirror.errors.consent"));
      return;
    }

    setError(null);
    previewBatchKeyRef.current = null;
    setGeneratedPreviews({});
    setPreviewsCompleted(0);
    analyzeHairstyle.mutate({
      imageDataUrl,
      locale,
    });
  };

  const imageQualityNotes = analysis?.analysisSummary.imageQualityNotes || [];
  const visibleHairNotes = analysis?.analysisSummary.visibleHairNotes || [];

  const isAnalyzing = analyzeHairstyle.isPending;
  const totalPreviews = recommendations.length;
  const isPreviewing =
    !!analysis &&
    analysis.status === "ok" &&
    totalPreviews > 0 &&
    previewsCompleted < totalPreviews;
  const isPreparing = isAnalyzing || isPreviewing;

  const expectedTotalSteps =
    1 + (analysis ? totalPreviews : ASSUMED_RECOMMENDATION_COUNT);
  const completedSteps = (analysis ? 1 : 0) + previewsCompleted;
  const realMilestoneProgress = Math.min(
    100,
    Math.round((completedSteps / expectedTotalSteps) * 100),
  );

  // Per-phase ceiling so the bar can creep through the entire phase, not just
  // up to the next single milestone (previews land in parallel near the end).
  const progressCeiling = isAnalyzing
    ? Math.max(
        0,
        Math.round((1 / (1 + ASSUMED_RECOMMENDATION_COUNT)) * 100) - 1,
      )
    : isPreviewing
      ? 99
      : 100;

  useEffect(() => {
    progressCeilingRef.current = progressCeiling;
  }, [progressCeiling]);

  // Reset on idle; snap to 100 the moment everything is done.
  useEffect(() => {
    if (!isPreparing) {
      setDisplayedProgress(analysis ? 100 : 0);
    }
  }, [isPreparing, analysis]);

  // Real milestones act as a floor — never let the bar move backward.
  useEffect(() => {
    if (!isPreparing) {
      return;
    }
    setDisplayedProgress((current) =>
      Math.max(current, realMilestoneProgress),
    );
  }, [realMilestoneProgress, isPreparing]);

  // Slow tween toward the current phase ceiling.
  useEffect(() => {
    if (!isPreparing) {
      return;
    }
    const intervalId = window.setInterval(() => {
      setDisplayedProgress((current) =>
        Math.min(progressCeilingRef.current, current + PROGRESS_TICK_DELTA),
      );
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [isPreparing]);

  const progress = displayedProgress;

  const progressLabel = isAnalyzing
    ? t("aiMirror.progressAnalyzing")
    : isPreviewing
      ? t("aiMirror.progressPreviews", {
          current: previewsCompleted + 1,
          total: totalPreviews,
        })
      : t("aiMirror.progressComplete");

  const isAnalyzeDisabled =
    !imageDataUrl || !hasConsent || isPreparing;

  return (
    <motion.div
      key="aiMirror"
      custom={direction}
      variants={slideAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="h-full overflow-y-auto p-4 md:p-6 lg:overflow-hidden"
    >
      <div className="grid gap-6 lg:h-full lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t("aiMirror.eyebrow")}
            </div>
            <h2 className="text-2xl font-semibold tracking-normal">
              {t("aiMirror.title")}
            </h2>
          </div>

          <div className="space-y-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            {previewUrl ? (
              <div className="space-y-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-background lg:min-h-0 lg:flex-1 lg:aspect-auto">
                  <Image
                    src={previewUrl}
                    alt={t("aiMirror.previewAlt")}
                    fill
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-background/70 p-6 text-center lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center">
                <input
                  id="ai-mirror-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isPreparing}
                />
                <label
                  htmlFor="ai-mirror-image"
                  className="flex cursor-pointer flex-col items-center gap-3"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="font-medium">{t("aiMirror.uploadTitle")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("aiMirror.uploadHint")}
                  </span>
                </label>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm">
              <button
                type="button"
                aria-pressed={hasConsent}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
                  hasConsent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background",
                )}
                onClick={() => setHasConsent((current) => !current)}
              >
                {hasConsent && <Check className="h-3.5 w-3.5" />}
              </button>
              <span className="text-muted-foreground">
                {t("aiMirror.consent")}
              </span>
            </label>

            {(error || analyzeHairstyle.error) && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error || analyzeHairstyle.error?.message}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="sm:col-span-2"
                  onClick={handleRemoveImage}
                  disabled={isPreparing}
                >
                  <X className="h-4 w-4" />
                  {t("aiMirror.removeImage")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={analyzeHairstyle.isPending}
              >
                {t("aiMirror.back")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={analyzeHairstyle.isPending}
              >
                {t("aiMirror.skip")}
              </Button>
              <Button
                type="button"
                className="sm:col-span-2"
                onClick={handleAnalyze}
                disabled={isAnalyzeDisabled}
              >
                {isPreparing && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isPreparing
                  ? t("aiMirror.analyzing")
                  : t("aiMirror.analyze")}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:pr-2">
          {isPreparing && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progressLabel}</span>
                <span className="tabular-nums text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!isPreparing && analysis && (
            <div className="rounded-lg border bg-background p-4">
              <h3 className="font-semibold">{t("aiMirror.resultsTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {analysis.status === "needs_better_photo"
                  ? t("aiMirror.retakeHint")
                  : t("aiMirror.resultsHint")}
              </p>
              {analysis.analysisSummary.faceShape && (
                <p className="mt-3 text-sm">
                  <span className="font-medium">{t("aiMirror.faceShape")}:</span>{" "}
                  {analysis.analysisSummary.faceShape}
                </p>
              )}
              {[...visibleHairNotes, ...imageQualityNotes].length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {[...visibleHairNotes, ...imageQualityNotes].map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isPreparing && recommendations.length > 0 && (
            <div className="grid gap-3">
              {recommendations.map((recommendation) => {
                const recommendationKey = getRecommendationKey(recommendation);
                const matchedService = recommendation.matchedServiceId
                  ? servicesById.get(recommendation.matchedServiceId)
                  : undefined;
                const previewImage =
                  generatedPreviews[recommendationKey] ||
                  recommendation.previewImageDataUrl;

                return (
                  <button
                    key={recommendationKey}
                    type="button"
                    className="overflow-hidden rounded-lg border bg-background text-left transition-colors hover:bg-muted/60"
                    onClick={() => onRecommendationSelect(recommendation)}
                  >
                    {previewImage && (
                      <div className="relative aspect-[4/3] bg-muted">
                        <Image
                          src={previewImage}
                          alt={recommendation.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="font-semibold">{recommendation.title}</h4>
                          {matchedService && (
                            <p className="text-xs text-primary">
                              {matchedService.name}
                            </p>
                          )}
                        </div>
                        <span className="w-fit rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">
                          {recommendation.maintenanceLevel}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {recommendation.reason}
                      </p>
                      <p className="mt-2 text-sm">{recommendation.stylingNotes}</p>
                      <span className="mt-4 inline-flex text-sm font-medium text-primary">
                        {recommendation.bookingLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isPreparing && !analysis && (
            <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t("aiMirror.emptyState")}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
