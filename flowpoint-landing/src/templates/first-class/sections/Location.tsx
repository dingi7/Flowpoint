"use client"

import { MapPin, Phone } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/useTranslation"
import { LandingPageSettings, Organization } from "@/core"

export interface LocationProps {
  organization: Organization
  landingPage?: LandingPageSettings | null
}

export default function Location({ organization, landingPage }: LocationProps) {
  const { t } = useTranslation()

  if (!organization) return null
  
  // Helper function to format working days
  const formatWorkingDays = (workingDays: string[]) => {
    const dayNames = {
      monday: "Monday",
      tuesday: "Tuesday", 
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    };
    
    return workingDays.map(day => dayNames[day as keyof typeof dayNames] || day).join(", ");
  };

  // Helper function to determine if we work on weekends
  const hasWeekendHours = (workingDays: string[]) => {
    return workingDays.some(day => day === "saturday" || day === "sunday");
  };

  const location = {
    address: organization.settings.contactInfo.address,
    mapUrl:
      landingPage?.location?.mapEmbedUrl ||
      organization.settings.contactInfo.googleMapsUrl ||
      "",
    phone: organization.settings.contactInfo.phone,
    workingHours: {
      start: organization.settings.workingHours.start,
      end: organization.settings.workingHours.end,
      days: organization.settings.workingDays,
      formattedDays: formatWorkingDays(organization.settings.workingDays),
      hasWeekend: hasWeekendHours(organization.settings.workingDays)
    },
  }

  const sectionTitle =
    landingPage?.location?.sectionTitle || t("location.title")
  const sectionDescription =
    landingPage?.location?.sectionDescription || t("location.description")

  const buildEmbedUrl = (rawUrl: string, fallbackQuery?: string) => {
    if (!rawUrl && fallbackQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        fallbackQuery,
      )}&output=embed`;
    }

    if (!rawUrl) return "";

    const isGoogle = rawUrl.includes("google.com");
    const hasEmbed =
      rawUrl.includes("embed") || rawUrl.includes("output=embed");

    if (!isGoogle || hasEmbed) {
      return rawUrl;
    }

    const fallback = fallbackQuery || organization.name;
    return fallback
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          fallback,
        )}&output=embed`
      : "";
  };

  const mapEmbedUrl = buildEmbedUrl(location.mapUrl, location.address);

  return (
    <section className="bg-[#1C1C1C] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">{sectionTitle.split(" ")[0]}</span>{" "}
              <span className="text-[#B5A48A]">
                {sectionTitle.split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <p className="text-gray-400 max-w-lg">
              {sectionDescription}
            </p>
          </div>

          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-[#98B8A0]" />
                <h3 className="text-white text-xl font-semibold">{t("location.locationTitle")}</h3>
              </div>
              <p className="text-gray-400 mb-4">{location.address}</p>
              {location.mapUrl && (
                <Link
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B5A48A] hover:text-[#C8B79D] transition-colors duration-300 inline-flex items-center gap-2"
                >
                  {t("location.getDirections")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Phone className="text-[#98B8A0]" />
                <h3 className="text-white text-xl">{location.phone}</h3>
              </div>
              <div className="text-gray-400 space-y-2">
                <div>
                  <p className="font-medium text-white mb-1">Working Hours</p>
                  <p>{location.workingHours.start} - {location.workingHours.end}</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Working Days</p>
                  <p>{location.workingHours.formattedDays}</p>
                </div>
                {!location.workingHours.hasWeekend && (
                  <p className="text-sm text-gray-500 italic">Closed on weekends</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden">
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale contrast-125 brightness-75"
              title={`${organization.name} Location`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#161616]">
              {t("location.locationTitle")}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
