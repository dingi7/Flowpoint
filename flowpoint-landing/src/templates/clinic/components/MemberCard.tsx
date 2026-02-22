import { FadeInView } from "./FadeInView";
import { useTranslation } from "@/lib/useTranslation";
import { Member } from "@/core";
import Image from "next/image";
import { useBookingModalStore } from "@/stores/booking-modal-store";
import { Barber } from "@/stores/types/booking-modal.types";
import { getLocalizedMemberValue } from "@/lib/member-localization";
import { ArrowRight } from "lucide-react";

export function MemberCard({
  member,
  index,
  primaryColor = "#0f766e",
}: {
  member: Member;
  index: number;
  primaryColor?: string;
}) {
  const { t, locale } = useTranslation();
  const { setInitialBarber, openModal } = useBookingModalStore();

  const localizedName = getLocalizedMemberValue(member, "name", locale);
  const localizedDescription = getLocalizedMemberValue(member, "description", locale);

  const handleBookNow = () => {
    const barber: Barber = {
      id: member.id,
      name: localizedName,
      image: member.image,
      description: localizedDescription,
      working: true,
    };
    setInitialBarber(barber);
    openModal();
  };

  return (
    <FadeInView key={member.id} delay={index * 0.12}>
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 w-[90vw] sm:w-[85vw] md:w-[320px] max-w-full">
        {/* Image */}
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          <Image
            src={member.image || "/placeholder.svg"}
            alt={localizedName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 90vw, (max-width: 768px) 85vw, 320px"
            priority={index < 3}
            loading={index < 3 ? undefined : "lazy"}
            fetchPriority={index < 3 ? "high" : "auto"}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Name overlaid on image bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-white text-xl font-bold leading-tight mb-1">
              {localizedName}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {localizedDescription && (
            <p className="text-slate-500 text-sm leading-relaxed mb-5 line-clamp-3">
              {localizedDescription}
            </p>
          )}

          {member.status === "active" && (
            <button
              onClick={handleBookNow}
              className="group/btn flex items-center justify-between w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 text-white"
              style={{ background: primaryColor }}
            >
              <span>{t("team.bookNow")}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </FadeInView>
  );
}
