"use client";

import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import { FadeInView } from "../components/FadeInView";
import ScrollDownButton from "../components/ScrollDownButton";
import { useTranslation } from "@/lib/useTranslation";
import { useBookingModalStore } from "@/stores/booking-modal-store";

export const HeroSection = () => {
  const { openModal } = useBookingModalStore();
  const { t } = useTranslation();

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center pt-20"
    >
      <motion.video
        autoPlay
        loop
        muted
        playsInline
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-0 w-full h-full object-cover blur-md brightness-[0.2]"
      >
        <source
          src="https://0o3lgk0frc.ufs.sh/f/hPValf4qdHVn80LQcDC6XJqKmpzwTuogRvIMcBs2hkj9QWnU"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </motion.video>

      <div className="relative z-10 text-center w-full px-4 sm:px-6 lg:px-8">
        <FadeInView delay={0.5}>
          <div className={`text-center`}>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8,
                delay: 0.6,
                ease: "easeOut"
              }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 text-white"
            >
              {t("hero.title")}
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8,
                delay: 0.8,
                ease: "easeOut"
              }}
              className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-300"
            >
              {t("hero.subtitle")}
            </motion.p>
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 0.8,
              delay: 1,
              ease: "easeOut"
            }}
          >
            <Button
              onClick={() => openModal()}
              className="w-full rounded-lg sm:w-2/3 md:w-1/2 lg:w-1/4 max-w-sm"
              variant="cta"
            >
              {t("hero.bookNow")}
            </Button>
          </motion.div>
        </FadeInView>
      </div>
      <ScrollDownButton targetSectionId="services" className="absolute bottom-[5%]" />
    </section>
  );
};
