"use client"

import { MapPin, Phone, Clock, CalendarDays } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/useTranslation"
import { LandingPageSettings, Organization } from "@/core"
import { FadeInView } from "../components/FadeInView"
import { JSX } from "react"

export interface LocationProps {
  organization: Organization
  landingPage?: LandingPageSettings | null
  primaryColor?: string
}

export default function Location({ organization, landingPage, primaryColor = "#0f766e" }: LocationProps) {
  const { t } = useTranslation()

  if (!organization) return null

  const formatWorkingDays = (workingDays: string[]) => {
    const dayNames: Record<string, string> = {
      monday: t("location.monday"),
      tuesday: t("location.tuesday"),
      wednesday: t("location.wednesday"),
      thursday: t("location.thursday"),
      friday: t("location.friday"),
      saturday: t("location.saturday"),
      sunday: t("location.sunday"),
    }
    return workingDays.map(day => dayNames[day as keyof typeof dayNames] || day).join(", ");
  };

  const hasWeekendHours = (workingDays: string[]) => {
    return workingDays.some(day => day === "saturday" || day === "sunday");
  };

  const location = {
    address: organization.settings.contactInfo.address,
    mapUrl: landingPage?.location?.mapEmbedUrl || organization.settings.contactInfo.googleMapsUrl || "",
    phone: organization.settings.contactInfo.phone,
    workingHours: {
      start: organization.settings.workingHours.start,
      end: organization.settings.workingHours.end,
      days: organization.settings.workingDays,
      formattedDays: formatWorkingDays(organization.settings.workingDays),
      hasWeekend: hasWeekendHours(organization.settings.workingDays)
    },
  }

  const sectionTitle = landingPage?.location?.sectionTitle || t("location.title")
  const sectionDescription = landingPage?.location?.sectionDescription || t("location.description")

  const buildEmbedUrl = (rawUrl: string, fallbackQuery?: string) => {
    if (!rawUrl && fallbackQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`;
    }
    if (!rawUrl) return "";
    const isGoogle = rawUrl.includes("google.com");
    const hasEmbed = rawUrl.includes("embed") || rawUrl.includes("output=embed");
    if (!isGoogle || hasEmbed) return rawUrl;
    const fallback = fallbackQuery || organization.name;
    return fallback
      ? `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&output=embed`
      : "";
  };

  const mapEmbedUrl = buildEmbedUrl(location.mapUrl, location.address);

  const infoItems = [
    location.address && {
      icon: <MapPin className="w-4 h-4" />,
      label: t("location.locationTitle") || "Address",
      value: location.address,
      link: location.mapUrl ? { href: location.mapUrl, label: t("location.getDirections") || "Get directions →" } : null,
    },
    location.phone && {
      icon: <Phone className="w-4 h-4" />,
      label: t("location.phone") || "Phone",
      value: location.phone,
      link: null,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: t("location.workingHoursLabel"),
      value: `${location.workingHours.start} – ${location.workingHours.end}`,
      link: null,
    },
    {
      icon: <CalendarDays className="w-4 h-4" />,
      label: t("location.workingDaysLabel"),
      value: location.workingHours.formattedDays + (!location.workingHours.hasWeekend ? ` (${t("location.weekdaysOnly")})` : ""),
      link: null,
    },
  ].filter(Boolean) as Array<{
    icon: JSX.Element;
    label: string;
    value: string;
    link: { href: string; label: string } | null;
  }>;

  return (
    <section className="relative bg-white py-24 md:py-32 overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-slate-200" />

      <div className="max-w-7xl mx-auto px-6">
        <FadeInView>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-8" style={{ background: primaryColor || '#0d9488' }} />
              <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: primaryColor || '#0f766e' }}>
                {t('location.eyebrow') || 'Find Us'}
              </span>
              <div className="h-px w-8" style={{ background: primaryColor || '#0d9488' }} />
            </div>
            <h2 className='font-["Playfair_Display",_Georgia,_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight'>
              {sectionTitle}
            </h2>
            {sectionDescription && (
              <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
                {sectionDescription}
              </p>
            )}
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Info Cards */}
          <FadeInView>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItems.map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ background: primaryColor }}>
                    {item.icon}
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">{item.label}</p>
                  <p className="text-slate-800 font-medium text-sm leading-relaxed">{item.value}</p>
                  {item.link && (
                    <Link
                      href={item.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 text-xs font-semibold transition-colors"
                      style={{ color: primaryColor }}
                    >
                      {item.link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </FadeInView>

          {/* Map */}
          <FadeInView delay={0.15}>
            <div className="w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)] border border-slate-100">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("location.mapTitle", { name: organization.name })}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                  <MapPin className="w-10 h-10 text-slate-300" />
                  <p className="text-slate-400 text-sm">{t("location.mapPlaceholder")}</p>
                </div>
              )}
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  )
}
