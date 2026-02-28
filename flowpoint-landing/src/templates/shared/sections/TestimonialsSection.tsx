"use client";

import { useEffect, useState, CSSProperties } from "react";

import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";

import { ImageCarousel } from "../components/ImageCarousel";

const TOTAL_IMAGES = 11;
const DEFAULT_TESTIMONIAL_IMAGES = Array.from(
  { length: TOTAL_IMAGES },
  (_, i) => `/testimonials/Testimonials${i + 1}.webp`,
);

export interface TestimonialsSectionProps {
  imageUrls?: string[];
  title?: string;
  sectionClassName?: string;
  headingClassName?: string;
  loadingTrackClassName?: string;
  loadingBarClassName?: string;
  loadingBarStyle?: CSSProperties;
  loadingTextClassName?: string;
  carouselImageClassName?: string;
  eyebrowColor?: string;
}

export function TestimonialsSection({
  imageUrls = [],
  title,
  sectionClassName,
  headingClassName,
  loadingTrackClassName,
  loadingBarClassName,
  loadingBarStyle,
  loadingTextClassName,
  carouselImageClassName,
  eyebrowColor,
}: TestimonialsSectionProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);

  const resolvedImages = imageUrls.length > 0 ? imageUrls : DEFAULT_TESTIMONIAL_IMAGES;

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setLoadedImagesCount(0);

    if (!resolvedImages.length) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const imagePromises = resolvedImages.map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.src = src;

          image.onload = () => {
            if (isMounted) {
              setLoadedImagesCount((prev) => prev + 1);
            }
            resolve();
          };

          image.onerror = () => {
            if (isMounted) {
              setLoadedImagesCount((prev) => prev + 1);
            }
            resolve();
          };
        }),
    );

    Promise.all(imagePromises).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [resolvedImages]);

  const loadingProgress = resolvedImages.length
    ? Math.round((loadedImagesCount / resolvedImages.length) * 100)
    : 100;

  const resolvedTitle = title || t("gallery.title");
  const loadingLabel = t("gallery.loading");
  const loadedSuffix = loadingLabel === "gallery.loading" ? "loaded" : loadingLabel;
  const clientLabel = t("gallery.client");
  const altPrefix = clientLabel === "gallery.client" ? "Client" : clientLabel;

  return (
    <section id="gallery" className={cn("overflow-hidden", sectionClassName)}>
      <div className="container mx-auto px-4">
        {eyebrowColor && (
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: eyebrowColor }} />
            <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: eyebrowColor }}>
              {t('gallery.eyebrow') || 'Gallery'}
            </span>
            <div className="h-px w-8" style={{ background: eyebrowColor }} />
          </div>
        )}
        <h2 className={cn("mb-12 text-center text-4xl font-bold md:text-5xl", headingClassName)}>
          {resolvedTitle}
        </h2>

        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <div className={cn("mb-4 h-2.5 w-full max-w-xs rounded-full bg-slate-200", loadingTrackClassName)}>
              <div
                className={cn(
                  "h-2.5 rounded-full bg-primary transition-all duration-300",
                  loadingBarClassName,
                )}
                style={{ width: `${loadingProgress}%`, ...loadingBarStyle }}
              />
            </div>
            <p className={cn("text-sm text-slate-500", loadingTextClassName)}>
              {loadingProgress}% {loadedSuffix}
            </p>
          </div>
        ) : (
          <ImageCarousel images={resolvedImages} altPrefix={altPrefix} imageClassName={carouselImageClassName} />
        )}
      </div>
    </section>
  );
}
