"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 50;

type ImageCarouselProps = {
  images: string[];
  altPrefix?: string;
  autoPlayMs?: number;
  className?: string;
  imageClassName?: string;
  controlsClassName?: string;
  indicatorsClassName?: string;
};

const wrapIndex = (value: number, total: number) =>
  ((value % total) + total) % total;

const getRelativeOffset = (index: number, activeIndex: number, total: number) => {
  let diff = index - activeIndex;

  if (diff > total / 2) {
    diff -= total;
  }

  if (diff < -total / 2) {
    diff += total;
  }

  return diff;
};

export function ImageCarousel({
  images,
  altPrefix = "Slide",
  autoPlayMs = 3200,
  className,
  imageClassName,
  controlsClassName,
  indicatorsClassName,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const imageCount = images.length;
  const hasMultiple = imageCount > 1;

  const goTo = useCallback(
    (nextIndex: number) => {
      if (!imageCount) {
        return;
      }

      setActiveIndex(wrapIndex(nextIndex, imageCount));
    },
    [imageCount],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!hasMultiple || isPaused) {
      return;
    }

    const intervalId = window.setInterval(goNext, autoPlayMs);
    return () => window.clearInterval(intervalId);
  }, [autoPlayMs, goNext, hasMultiple, isPaused]);

  useEffect(() => {
    if (!hasMultiple) {
      return;
    }

    setActiveIndex((currentIndex) => wrapIndex(currentIndex, imageCount));
  }, [hasMultiple, imageCount]);

  if (!imageCount) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1320px] pt-2 pb-16",
        "select-none touch-pan-y",
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
        touchDeltaX.current = 0;
      }}
      onTouchMove={(event) => {
        if (touchStartX.current === null) {
          return;
        }

        touchDeltaX.current = (event.touches[0]?.clientX ?? 0) - touchStartX.current;
      }}
      onTouchEnd={() => {
        if (!hasMultiple) {
          touchStartX.current = null;
          touchDeltaX.current = 0;
          return;
        }

        if (touchDeltaX.current > SWIPE_THRESHOLD_PX) {
          goPrev();
        } else if (touchDeltaX.current < -SWIPE_THRESHOLD_PX) {
          goNext();
        }

        touchStartX.current = null;
        touchDeltaX.current = 0;
      }}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={(event) => {
        if (!hasMultiple) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrev();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }
      }}
      tabIndex={0}
      aria-roledescription="carousel"
    >
      <div className="relative h-[64vw] max-h-[640px] min-h-[280px] overflow-hidden">
        {images.map((src, index) => {
          const offset = getRelativeOffset(index, activeIndex, imageCount);
          const absOffset = Math.abs(offset);
          const isVisible = absOffset <= 1;
          const translateX = offset * 58;
          const scale = offset === 0 ? 1 : 0.86;
          const opacity = offset === 0 ? 1 : 0.68;
          const zIndex = offset === 0 ? 30 : 20;

          return (
            <button
              type="button"
              key={`${src}-${index}`}
              aria-label={`Go to ${altPrefix} ${index + 1}`}
              onClick={() => goTo(index)}
              className={cn(
                "absolute top-1/2 left-1/2 h-[94%] w-[86%] sm:w-[74%] lg:w-[56%]",
                "overflow-hidden rounded-xl transition-all duration-500 ease-out",
                "shadow-[0_16px_50px_rgba(15,23,42,0.25)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80",
                !isVisible && "pointer-events-none",
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale})`,
                opacity: isVisible ? opacity : 0,
                zIndex,
              }}
            >
              <img
                src={src}
                alt={`${altPrefix} ${index + 1}`}
                className={cn("h-full w-full object-cover", imageClassName)}
                loading={Math.abs(index - activeIndex) <= 1 ? "eager" : "lazy"}
              />
            </button>
          );
        })}
      </div>

      {hasMultiple ? (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 sm:px-6",
              "flex items-center justify-between",
              controlsClassName,
            )}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            className={cn(
              "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2",
              indicatorsClassName,
            )}
          >
            {images.map((_, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  type="button"
                  key={`indicator-${index}`}
                  aria-label={`Go to ${altPrefix} ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    isActive
                      ? "w-7 bg-primary"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400",
                  )}
                />
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
