"use client"

import { MapPin, Phone } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/useTranslation"
import { useOrganization } from "@/hooks/repository-hooks/organization/use-organization"

export default function Location() {
  const { data: organization } = useOrganization()
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
    mapUrl: organization.settings.contactInfo.googleMapsUrl || "",
    phone: organization.settings.contactInfo.phone,
    workingHours: {
      start: organization.settings.workingHours.start,
      end: organization.settings.workingHours.end,
      days: organization.settings.workingDays,
      formattedDays: formatWorkingDays(organization.settings.workingDays),
      hasWeekend: hasWeekendHours(organization.settings.workingDays)
    },
  }

  return (
    <section className="bg-[#1C1C1C] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">{t("location.title").split(" ")[0]}</span>{" "}
              <span className="text-[#B5A48A]">
                {t("location.title").split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <p className="text-gray-400 max-w-lg">
              {t("location.description")}
            </p>
          </div>

          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-[#98B8A0]" />
                <h3 className="text-white text-xl font-semibold">{t("location.locationTitle")}</h3>
              </div>
              <p className="text-gray-400 mb-4">{location.address}</p>
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
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d186.03866310876737!2d27.898116!3d43.2177383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a45486577bb3f7%3A0x5226892607aebd19!2sGrand%20Mall!5e0!3m2!1sen!2sbg!4v1710271144949!5m2!1sen!2sbg"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale contrast-125 brightness-75"
            title="Golden Scissors Barbershop Location"
          />
        </div>
      </div>
    </section>
  )
}

