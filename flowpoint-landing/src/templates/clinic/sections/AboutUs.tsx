"use client";

import { Heart, Shield, Users, Award } from "lucide-react";
import { FadeInView } from "../components/FadeInView";
import { useTranslation } from "@/lib/useTranslation";

export interface AboutUsProps {
  title?: string;
  description?: string;
  patientsServed?: string;
  specialists?: string;
  yearsOfService?: string;
  patientSatisfaction?: string;
  bullets?: string[];
  primaryColor?: string;
}

export function AboutUs({
  title,
  description,
  patientsServed,
  specialists,
  yearsOfService,
  patientSatisfaction,
  bullets = [],
  primaryColor = "#0f766e",
}: AboutUsProps) {
  const { t } = useTranslation();
  const resolvedTitle = title || t("aboutUs.title") || "Trusted Healthcare";

  const stats = [
    patientsServed && { label: t("aboutUs.patientsServed") || "Patients Served", value: patientsServed, icon: Heart },
    specialists && { label: t("aboutUs.specialists") || "Specialists", value: specialists, icon: Users },
    yearsOfService && { label: t("aboutUs.yearsOfService") || "Years of Service", value: yearsOfService, icon: Award },
    patientSatisfaction && { label: t("aboutUs.patientSatisfaction") || "Patient Satisfaction", value: patientSatisfaction, icon: Shield },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: typeof Heart }>;

  const hasContent = description || stats.length > 0 || bullets.length > 0;
  if (!hasContent) return null;

  return (
    <section id="about" className="relative bg-slate-50 py-24 md:py-32 overflow-hidden">
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
                {t("aboutUs.eyebrow") || "About Us"}
              </span>
              <div className="h-px w-8" style={{ background: primaryColor }} />
            </div>
            <h2 className='font-["Playfair_Display",_Georgia,_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight'>
              {resolvedTitle}
            </h2>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeInView>
            <div className="space-y-6">
              {description && (
                <p className="text-slate-600 text-lg leading-relaxed">
                  {description}
                </p>
              )}
              {bullets.length > 0 && (
                <ul className="space-y-3">
                  {bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                        style={{ background: primaryColor }}
                      />
                      <span className="text-slate-600">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FadeInView>

          {stats.length > 0 && (
            <FadeInView delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 text-center"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white"
                        style={{ background: primaryColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </FadeInView>
          )}
        </div>
      </div>
    </section>
  );
}
