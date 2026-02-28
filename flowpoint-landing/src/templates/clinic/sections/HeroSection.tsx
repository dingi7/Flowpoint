"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/useTranslation";
import { useBookingModalStore } from "@/stores/booking-modal-store";

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  backgroundVideoUrl?: string;
  backgroundImageUrl?: string;
  primaryColor?: string;
}

export const HeroSection = ({
  title,
  subtitle,
  ctaLabel,
  backgroundVideoUrl,
  backgroundImageUrl,
  primaryColor = "#0f766e",
}: HeroSectionProps) => {
  const { openModal } = useBookingModalStore();
  const { t } = useTranslation();
  const resolvedTitle = title || t("hero.title");
  const resolvedSubtitle = subtitle || t("hero.subtitle");
  const resolvedCtaLabel = ctaLabel || t("hero.bookNow");

  const hasMedia = backgroundVideoUrl || backgroundImageUrl;

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      {/* Background layers */}
      {backgroundVideoUrl ? (
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideoUrl} type="video/mp4" />
        </motion.video>
      ) : backgroundImageUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full bg-center bg-cover"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      ) : (
        /* Premium gradient when no media */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800" />
      )}

      {/* Overlay */}
      {hasMedia && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      )}

      {/* Decorative grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circle accent */}
      {!hasMedia && (
        <>
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
            style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
            style={{ background: `radial-gradient(circle, #0d9488, transparent)` }} />
        </>
      )}

      <div className="relative z-10 text-center w-full max-w-5xl mx-auto px-6 pt-20">
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px w-12 bg-teal-400/60" />
          <span className="text-teal-300 text-xs tracking-[0.25em] uppercase font-medium">
            {t("hero.welcomeTo") || "Wellness & Care"}
          </span>
          <div className="h-px w-12 bg-teal-400/60" />
        </motion.div>

        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-['Playfair_Display',_Georgia,_serif] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] tracking-tight text-white"
        >
          {resolvedTitle}
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
          className="text-lg sm:text-xl md:text-2xl mb-12 text-white/70 max-w-2xl mx-auto font-light leading-relaxed"
        >
          {resolvedSubtitle}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => openModal()}
            className="group relative overflow-hidden px-10 py-4 rounded-full font-semibold text-base tracking-wide transition-all duration-300 text-white shadow-2xl hover:shadow-teal-500/25 hover:scale-105"
            style={{ background: primaryColor || "#0f766e" }}
          >
            <span className="relative z-10">{resolvedCtaLabel}</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("services");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-10 py-4 rounded-full font-medium text-base tracking-wide text-white/80 border border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300"
          >
            {t("hero.ourServices") || "Our Services"}
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40 text-xs tracking-widest uppercase"
        >
          <span>{t("hero.trusted") || "Trusted Care"}</span>
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <span>{t("hero.professional") || "Professional Team"}</span>
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <span>{t("hero.modern") || "Modern Approach"}</span>
        </motion.div>
      </div>
    </section>
  );
};
