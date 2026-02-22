"use client";

import { Star, Quote } from "lucide-react";
import { FadeInView } from "../components/FadeInView";
import { useTranslation } from "@/lib/useTranslation";

export interface TestimonialItem {
  quote: string;
  authorName: string;
  authorRole?: string;
  rating?: number;
}

export interface TestimonialsProps {
  items?: TestimonialItem[];
  title?: string;
  primaryColor?: string;
}

export const Testimonials = ({
  items = [],
  title,
  primaryColor = "#0f766e",
}: TestimonialsProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t("testimonials.title") || "What Our Patients Say";

  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="relative bg-slate-50 py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-slate-200" />

      <div className="max-w-7xl mx-auto px-6">
        <FadeInView>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-8" style={{ background: primaryColor }} />
              <span
                className="text-xs tracking-[0.2em] uppercase font-semibold"
                style={{ color: primaryColor }}
              >
                {t("testimonials.eyebrow") || "Testimonials"}
              </span>
              <div className="h-px w-8" style={{ background: primaryColor }} />
            </div>
            <h2 className='font-["Playfair_Display",_Georgia,_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight'>
              {resolvedTitle}
            </h2>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <FadeInView key={index} delay={index * 0.08}>
              <div className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <Quote className="w-8 h-8 mb-5 opacity-15" style={{ color: primaryColor }} />

                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (item.rating ?? 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="border-t border-slate-100 pt-5">
                  <p className="font-semibold text-slate-900 text-sm">
                    {item.authorName}
                  </p>
                  {item.authorRole && (
                    <p className="text-slate-400 text-xs mt-0.5">{item.authorRole}</p>
                  )}
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
};
